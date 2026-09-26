import { Inject, Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import type { OwnerContext } from 'src/common/types/owner-context';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import {
  AssetKind,
  AssetOrigin,
  AssetPurpose,
  AssetStatus,
  type AssetUploadTicket,
  type CreateAssetUploadInput,
  type ProjectAsset,
  SceneClipMode,
} from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import { ProjectsService } from '../projects/projects.service';
import { S3Service } from '../s3/s3.service';
import type {
  AiClipRecord,
  AssetRecord,
  AssetsRepository,
} from './repositories/assets.repository';

/** Upload limits (open decisions 14 and 18; demo values). */
export const MAX_ASSETS_PER_PROJECT = 20;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_CLIP_BYTES = 100 * 1024 * 1024;
const MAX_CLIP_SECONDS = 60;
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 90;

/** Audio purposes keep one current file per project. */
const AUDIO_PURPOSES = [AssetPurpose.RECORDING, AssetPurpose.MUSIC];
/** An upload never completed after this long no longer counts or shows. */
const STALE_UPLOAD_MS = 60 * 60 * 1000;

const ALLOWED_TYPES: Record<string, { kind: AssetKind; extension: string }> = {
  'image/jpeg': { kind: AssetKind.PHOTO, extension: 'jpg' },
  'image/png': { kind: AssetKind.PHOTO, extension: 'png' },
  'image/webp': { kind: AssetKind.PHOTO, extension: 'webp' },
  'video/mp4': { kind: AssetKind.CLIP, extension: 'mp4' },
  'video/quicktime': { kind: AssetKind.CLIP, extension: 'mov' },
  'audio/mpeg': { kind: AssetKind.AUDIO, extension: 'mp3' },
  'audio/mp4': { kind: AssetKind.AUDIO, extension: 'm4a' },
  'audio/x-m4a': { kind: AssetKind.AUDIO, extension: 'm4a' },
  'audio/wav': { kind: AssetKind.AUDIO, extension: 'wav' },
  'audio/x-wav': { kind: AssetKind.AUDIO, extension: 'wav' },
};

const MAX_BYTES: Record<AssetKind, { bytes: number; message: string }> = {
  [AssetKind.PHOTO]: { bytes: MAX_PHOTO_BYTES, message: 'Larger than 10 MB.' },
  [AssetKind.CLIP]: { bytes: MAX_CLIP_BYTES, message: 'Larger than 100 MB.' },
  [AssetKind.AUDIO]: { bytes: MAX_AUDIO_BYTES, message: 'Larger than 20 MB.' },
};

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @Inject(TOKENS.ASSETS_REPOSITORY)
    private readonly assets: AssetsRepository,
    private readonly projectsService: ProjectsService,
    private readonly s3Service: S3Service,
  ) {}

  async list(projectId: string, owner: OwnerContext): Promise<ProjectAsset[]> {
    await this.projectsService.getRecord(projectId, owner);

    const records = await this.readyAssets(projectId, owner);

    return Promise.all(records.map((record) => this.toGraphql(record)));
  }

  /** Ready photos and clips with their storage keys, for the media worker. */
  async mediaRecords(
    projectId: string,
    owner: OwnerContext,
  ): Promise<AssetRecord[]> {
    return this.readyAssets(projectId, owner);
  }

  /**
   * Stores an AI scene clip the media worker already put at `storageKey`.
   * It inherits the source photo's rights confirmation, and starts unchecked.
   */
  async createGeneratedClip(params: {
    id: string;
    owner: OwnerContext;
    projectId: string;
    storageKey: string;
    fileName: string;
    sizeBytes: number;
    durationSeconds: number;
    rightsConfirmedAt: Date;
    aiClip: Omit<AiClipRecord, 'checkedAt'>;
  }): Promise<AssetRecord> {
    const now = new Date();
    const record = await this.assets.create({
      id: params.id,
      ownerId: params.owner.ownerId,
      organizationId: params.owner.organizationId,
      projectId: params.projectId,
      kind: AssetKind.CLIP,
      purpose: AssetPurpose.MEDIA,
      origin: AssetOrigin.AI_CLIP,
      aiClip: { ...params.aiClip, checkedAt: null },
      status: AssetStatus.READY,
      fileName: params.fileName,
      contentType: 'video/mp4',
      sizeBytes: params.sizeBytes,
      durationSeconds: params.durationSeconds,
      storageKey: params.storageKey,
      rightsConfirmedAt: params.rightsConfirmedAt,
      replacesAssetId: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.syncProject(params.projectId, params.owner);

    return record;
  }

  /** Records the creator's product-accuracy check on an AI clip, once. */
  async checkGeneratedClip(
    id: string,
    owner: OwnerContext,
  ): Promise<ProjectAsset> {
    const record = await this.getRecord(id, owner);

    if (originOf(record) !== AssetOrigin.AI_CLIP || !record.aiClip) {
      throw new ConflictError('Only AI clips need a check.', {
        code: 'NOT_AN_AI_CLIP',
      });
    }

    if (record.aiClip.checkedAt) return this.toGraphql(record);

    const aiClip = { ...record.aiClip, checkedAt: new Date() };

    await this.assets.updateOne(
      applyTenantFilter<AssetRecord>(
        { id: record.id, ownerId: owner.ownerId },
        owner.organizationId,
      ),
      { aiClip, updatedAt: new Date() },
    );

    return this.toGraphql({ ...record, aiClip });
  }

  /** The AI clips one clip job made, oldest first. */
  async generatedClipsFor(
    projectId: string,
    jobId: string,
    owner: OwnerContext,
  ): Promise<AssetRecord[]> {
    const records = await this.readyAssets(projectId, owner);

    return records.filter((record) => record.aiClip?.jobId === jobId);
  }

  /** The project's current narration recording or music track, if any. */
  async currentAudioRecord(
    projectId: string,
    purpose: AssetPurpose.RECORDING | AssetPurpose.MUSIC,
    owner: OwnerContext,
  ): Promise<AssetRecord | null> {
    const [record] = await this.assets
      .list(
        applyTenantFilter<AssetRecord>(
          {
            projectId,
            ownerId: owner.ownerId,
            status: AssetStatus.READY,
            purpose,
          },
          owner.organizationId,
        ),
        { sort: { createdAt: 'DESC' } },
      )
      .collect();

    return record ?? null;
  }

  async currentAudio(
    projectId: string,
    purpose: AssetPurpose.RECORDING | AssetPurpose.MUSIC,
    owner: OwnerContext,
  ): Promise<ProjectAsset | null> {
    const record = await this.currentAudioRecord(projectId, purpose, owner);

    return record ? this.toGraphql(record) : null;
  }

  /**
   * Validates the file, records it as uploading and returns a presigned PUT
   * for a key the server chose. The browser uploads directly to storage.
   * Photos and clips (purpose MEDIA) count toward the 20-file limit; a
   * narration recording or music track does not, and replaces the project's
   * previous one once it is stored.
   */
  async createUpload(
    owner: OwnerContext,
    input: CreateAssetUploadInput,
  ): Promise<AssetUploadTicket> {
    const project = await this.projectsService.getRecord(
      input.projectId,
      owner,
    );

    if (!input.rightsConfirmed) {
      throw new ValidationError(
        'Confirm you have the right to use this file.',
        {
          field: 'input.rightsConfirmed',
        },
      );
    }

    const purpose = input.purpose ?? AssetPurpose.MEDIA;
    const isAudio = AUDIO_PURPOSES.includes(purpose);
    const type = ALLOWED_TYPES[input.contentType.trim().toLowerCase()];

    if (!type || (type.kind === AssetKind.AUDIO) !== isAudio) {
      throw new ValidationError('This file type isn’t supported.', {
        field: 'input.contentType',
      });
    }

    const maxBytes = MAX_BYTES[type.kind];

    if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) {
      throw new ValidationError('This file is empty.', {
        field: 'input.sizeBytes',
      });
    }

    if (input.sizeBytes > maxBytes.bytes) {
      throw new ValidationError(maxBytes.message, {
        field: 'input.sizeBytes',
      });
    }

    if (
      type.kind === AssetKind.CLIP &&
      input.durationSeconds !== null &&
      input.durationSeconds !== undefined &&
      input.durationSeconds > MAX_CLIP_SECONDS
    ) {
      throw new ValidationError('Clips can be up to 60 seconds.', {
        field: 'input.durationSeconds',
      });
    }

    if (
      purpose === AssetPurpose.RECORDING &&
      input.durationSeconds !== null &&
      input.durationSeconds !== undefined &&
      input.durationSeconds > MAX_RECORDING_SECONDS
    ) {
      throw new ValidationError('Recordings can be up to 90 seconds.', {
        field: 'input.durationSeconds',
      });
    }

    const replacing = input.replacesAssetId
      ? await this.getRecord(input.replacesAssetId, owner)
      : null;

    if (
      replacing &&
      (replacing.projectId !== project.id || purposeOf(replacing) !== purpose)
    ) {
      throw new NotFoundError('We can’t find that file.');
    }

    if (!isAudio) {
      const active = await this.activeCount(project.id, owner);

      if (active - (replacing ? 1 : 0) >= MAX_ASSETS_PER_PROJECT) {
        throw new ConflictError('You can upload up to 20 files per project.', {
          code: 'ASSET_LIMIT',
        });
      }
    }

    const id = new Types.ObjectId().toHexString();
    const folder = isAudio ? 'audio' : 'assets';
    const storageKey = `projects/${project.id}/${folder}/${id}.${type.extension}`;
    const now = new Date();

    const record = await this.assets.create({
      id,
      ownerId: owner.ownerId,
      organizationId: owner.organizationId,
      projectId: project.id,
      kind: type.kind,
      purpose,
      status: AssetStatus.UPLOADING,
      fileName: input.fileName.trim().slice(0, 200) || `file.${type.extension}`,
      contentType: input.contentType.trim().toLowerCase(),
      sizeBytes: input.sizeBytes,
      durationSeconds:
        type.kind === AssetKind.PHOTO ? null : (input.durationSeconds ?? null),
      storageKey,
      rightsConfirmedAt: now,
      replacesAssetId: replacing?.id ?? null,
      createdAt: now,
      updatedAt: now,
    });

    const uploadUrl = await this.s3Service.createPresignedPutUrlForKey(
      storageKey,
      record.contentType,
      record.sizeBytes,
    );

    return { asset: await this.toGraphql(record), uploadUrl };
  }

  /**
   * Confirms the browser's upload landed with the declared type and size, then
   * marks the file ready. A replaced file is removed only after its successor
   * is stored.
   */
  async completeUpload(id: string, owner: OwnerContext): Promise<ProjectAsset> {
    const record = await this.getRecord(id, owner);

    if (record.status === AssetStatus.READY) return this.toGraphql(record);

    const stored = await this.s3Service.headObject(record.storageKey);

    if (!stored) {
      throw new ConflictError('Upload failed. Try again.', {
        code: 'UPLOAD_MISSING',
      });
    }

    if (
      stored.contentLength !== record.sizeBytes ||
      (stored.contentType && stored.contentType !== record.contentType)
    ) {
      await this.deleteRecord(record, owner);
      throw new ConflictError('Upload failed. Try again.', {
        code: 'UPLOAD_MISMATCH',
      });
    }

    await this.assets.updateOne(
      applyTenantFilter<AssetRecord>(
        { id: record.id, ownerId: owner.ownerId },
        owner.organizationId,
      ),
      {
        status: AssetStatus.READY,
        updatedAt: new Date(),
      },
    );

    if (record.replacesAssetId) {
      const replaced = await this.findRecord(record.replacesAssetId, owner);
      if (replaced) await this.deleteRecord(replaced, owner);
    }

    if (AUDIO_PURPOSES.includes(purposeOf(record))) {
      await this.removeEarlierAudio(record, owner);
    } else {
      await this.syncProject(record.projectId, owner);
    }

    return this.toGraphql({ ...record, status: AssetStatus.READY });
  }

  async remove(id: string, owner: OwnerContext): Promise<boolean> {
    const record = await this.getRecord(id, owner);

    await this.deleteRecord(record, owner);
    await this.syncProject(record.projectId, owner);

    return true;
  }

  /** Copies every ready file into another of the owner's projects. */
  async copyToProject(
    sourceProjectId: string,
    targetProjectId: string,
    owner: OwnerContext,
  ): Promise<void> {
    const records = await this.readyAssets(sourceProjectId, owner);

    for (const record of records) {
      const id = new Types.ObjectId().toHexString();
      const extension = record.storageKey.split('.').pop() ?? 'bin';
      const storageKey = `projects/${targetProjectId}/assets/${id}.${extension}`;

      await this.s3Service.copyObject(record.storageKey, storageKey);
      await this.assets.create({
        ...record,
        id,
        projectId: targetProjectId,
        storageKey,
        replacesAssetId: null,
        createdAt: record.createdAt,
        updatedAt: new Date(),
      });
    }

    await this.syncProject(targetProjectId, owner);
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async findRecord(
    id: string,
    owner: OwnerContext,
  ): Promise<AssetRecord | null> {
    if (!/^[a-f0-9]{24}$/.test(id)) return null;

    const [record] = await this.assets
      .list(
        applyTenantFilter<AssetRecord>(
          { id, ownerId: owner.ownerId },
          owner.organizationId,
        ),
      )
      .collect();

    return record ?? null;
  }

  private async getRecord(
    id: string,
    owner: OwnerContext,
  ): Promise<AssetRecord> {
    const record = await this.findRecord(id, owner);

    if (!record) throw new NotFoundError('We can’t find that file.');

    return record;
  }

  /** Ready photos and clips (purpose MEDIA), oldest first. */
  private async readyAssets(
    projectId: string,
    owner: OwnerContext,
  ): Promise<AssetRecord[]> {
    return this.assets
      .list(
        applyTenantFilter<AssetRecord>(
          {
            projectId,
            ownerId: owner.ownerId,
            status: AssetStatus.READY,
            purpose: { notIn: AUDIO_PURPOSES },
          },
          owner.organizationId,
        ),
        { sort: { createdAt: 'ASC' } },
      )
      .collect();
  }

  private async activeCount(projectId: string, owner: OwnerContext) {
    const [ready, uploading] = await Promise.all([
      this.assets.count(
        applyTenantFilter<AssetRecord>(
          {
            projectId,
            ownerId: owner.ownerId,
            status: AssetStatus.READY,
            purpose: { notIn: AUDIO_PURPOSES },
            origin: { notIn: [AssetOrigin.AI_CLIP] },
          },
          owner.organizationId,
        ),
      ),
      this.assets.count(
        applyTenantFilter<AssetRecord>(
          {
            projectId,
            ownerId: owner.ownerId,
            status: AssetStatus.UPLOADING,
            purpose: { notIn: AUDIO_PURPOSES },
            origin: { notIn: [AssetOrigin.AI_CLIP] },
            createdAt: { greaterThan: new Date(Date.now() - STALE_UPLOAD_MS) },
          },
          owner.organizationId,
        ),
      ),
    ]);

    return ready + uploading;
  }

  /** Deletes the stored object first, then the record (never only the row). */
  private async deleteRecord(record: AssetRecord, owner: OwnerContext) {
    try {
      await this.s3Service.deleteObject(record.storageKey);
    } catch (error) {
      this.logger.error(
        `Could not delete stored object for asset ${record.id}.`,
        error as Error,
      );
      throw new ConflictError('We couldn’t remove that file. Try again.');
    }

    await this.assets.delete(
      applyTenantFilter<AssetRecord>(
        { id: record.id, ownerId: owner.ownerId },
        owner.organizationId,
      ),
    );
  }

  /** A project keeps one current recording and one current music track. */
  private async removeEarlierAudio(record: AssetRecord, owner: OwnerContext) {
    const earlier = await this.assets
      .list(
        applyTenantFilter<AssetRecord>(
          {
            projectId: record.projectId,
            ownerId: owner.ownerId,
            status: AssetStatus.READY,
            purpose: purposeOf(record),
            id: { notIn: [record.id] },
          },
          owner.organizationId,
        ),
      )
      .collect();

    for (const previous of earlier) await this.deleteRecord(previous, owner);
  }

  private async syncProject(projectId: string, owner: OwnerContext) {
    const ready = await this.readyAssets(projectId, owner);
    const firstPhoto = ready.find((asset) => asset.kind === AssetKind.PHOTO);

    await this.projectsService.syncMedia(
      projectId,
      owner,
      firstPhoto?.storageKey ?? null,
      ready.length,
    );
  }

  private async toGraphql(record: AssetRecord): Promise<ProjectAsset> {
    return {
      id: record.id,
      projectId: record.projectId,
      kind: record.kind,
      purpose: purposeOf(record),
      origin: originOf(record),
      aiClip: record.aiClip
        ? {
            jobId: record.aiClip.jobId,
            sceneId: record.aiClip.sceneId,
            sourceAssetId: record.aiClip.sourceAssetId,
            mode: record.aiClip.mode ?? SceneClipMode.FIRST_FRAME,
            endAssetId: record.aiClip.endAssetId ?? null,
            referenceAssetIds: record.aiClip.referenceAssetIds ?? [],
            continuitySceneId: record.aiClip.continuitySceneId ?? null,
            continuityAssetId: record.aiClip.continuityAssetId ?? null,
            label: record.aiClip.label,
            prompt: record.aiClip.prompt,
            checkedAt: record.aiClip.checkedAt,
          }
        : null,
      status: record.status,
      fileName: record.fileName,
      sizeBytes: record.sizeBytes,
      durationSeconds: record.durationSeconds,
      previewUrl:
        record.status === AssetStatus.READY
          ? await this.s3Service
              .createPresignedGetUrl(record.storageKey)
              .catch(() => null)
          : null,
      createdAt: record.createdAt,
    };
  }
}

function purposeOf(record: AssetRecord): AssetPurpose {
  return record.purpose ?? AssetPurpose.MEDIA;
}

function originOf(record: AssetRecord): AssetOrigin {
  return record.origin ?? AssetOrigin.UPLOAD;
}
