import { fakeRepository } from '../../../test/fake-repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import {
  AssetKind,
  AssetOrigin,
  AssetPurpose,
  AssetStatus,
} from 'src/graphql/generated/graphql';
import type { ProjectsService } from '../projects/projects.service';
import type { S3Service } from '../s3/s3.service';
import { AssetsService } from './assets.service';
import type {
  AssetRecord,
  AssetsRepository,
} from './repositories/assets.repository';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';
const owner = { ownerId: 'user-1', organizationId: TENANT_A };
const PROJECT_ID = 'b'.repeat(24);

function setup(storedSize = 1_200_000) {
  const repository = fakeRepository<AssetRecord>();
  const projectsService = {
    getRecord: jest.fn(async () => ({ id: PROJECT_ID })),
    syncMedia: jest.fn(async () => undefined),
  };
  const s3 = {
    createPresignedPutUrlForKey: jest.fn(
      async () => 'https://upload.example/put',
    ),
    createPresignedGetUrl: jest.fn(async () => 'https://upload.example/get'),
    headObject: jest.fn(async () => ({
      contentLength: storedSize,
      contentType: 'image/jpeg',
    })),
    deleteObject: jest.fn(async () => undefined),
  };
  const service = new AssetsService(
    repository as unknown as AssetsRepository,
    projectsService as unknown as ProjectsService,
    s3 as unknown as S3Service,
  );

  return { service, repository, projectsService, s3 };
}

const photo = {
  projectId: PROJECT_ID,
  fileName: 'blendgo-front.jpg',
  contentType: 'image/jpeg',
  sizeBytes: 1_200_000,
  rightsConfirmed: true,
};

const narration = {
  projectId: PROJECT_ID,
  fileName: 'narration.m4a',
  contentType: 'audio/x-m4a',
  sizeBytes: 900_000,
  durationSeconds: 31,
  rightsConfirmed: true,
  purpose: AssetPurpose.RECORDING,
};

/** A ready photo stored before audio uploads existed (no purpose field). */
function readyMedia(index: number): AssetRecord {
  const id = index.toString(16).padStart(24, '0');

  return {
    id,
    ownerId: owner.ownerId,
    organizationId: TENANT_A,
    projectId: PROJECT_ID,
    kind: AssetKind.PHOTO,
    status: AssetStatus.READY,
    fileName: `photo-${index}.jpg`,
    contentType: 'image/jpeg',
    sizeBytes: 1_000,
    durationSeconds: null,
    storageKey: `projects/${PROJECT_ID}/assets/${id}.jpg`,
    rightsConfirmedAt: new Date(0),
    replacesAssetId: null,
    createdAt: new Date(index),
    updatedAt: new Date(index),
  };
}

describe('AssetsService: AI clips', () => {
  const clip = {
    owner,
    projectId: PROJECT_ID,
    storageKey: `projects/${PROJECT_ID}/ai-clips/${'c'.repeat(24)}.mp4`,
    fileName: 'ai-clip-0001-a.mp4',
    sizeBytes: 2_000_000,
    durationSeconds: 6,
    rightsConfirmedAt: new Date(0),
    aiClip: {
      jobId: 'j'.repeat(24),
      sceneId: 's1',
      sourceAssetId: readyMedia(1).id,
      label: 'A',
      prompt: 'Close-up, hands only.',
      model: 'MiniMax-H3-Max',
      providerTaskId: 'task-1',
    },
  };

  it('stores a clip unchecked, lists it, and records its check once', async () => {
    const { service, repository } = setup();
    repository.records.push(readyMedia(1));

    await service.createGeneratedClip({ ...clip, id: 'c'.repeat(24) });
    const [listed] = (await service.list(PROJECT_ID, owner)).filter(
      (asset) => asset.origin === AssetOrigin.AI_CLIP,
    );

    expect(listed).toMatchObject({
      kind: AssetKind.CLIP,
      aiClip: { label: 'A', checkedAt: null },
    });

    const checked = await service.checkGeneratedClip('c'.repeat(24), owner);
    const again = await service.checkGeneratedClip('c'.repeat(24), owner);

    expect(checked.aiClip?.checkedAt).toBeInstanceOf(Date);
    expect(again.aiClip?.checkedAt).toEqual(checked.aiClip?.checkedAt);
    await expect(
      service.checkGeneratedClip(readyMedia(1).id, owner),
    ).rejects.toThrow(ConflictError);
    await expect(
      service.generatedClipsFor(PROJECT_ID, clip.aiClip.jobId, owner),
    ).resolves.toHaveLength(1);
  });

  it('reads a file stored before AI clips existed as an upload', async () => {
    const { service, repository } = setup();
    repository.records.push(readyMedia(1));

    const [listed] = await service.list(PROJECT_ID, owner);

    expect(listed.origin).toBe(AssetOrigin.UPLOAD);
    expect(listed.aiClip).toBeNull();
  });

  it('does not count AI clips toward the 20-file upload limit', async () => {
    const { service, repository } = setup();
    for (let index = 1; index <= 19; index += 1) {
      repository.records.push(readyMedia(index));
    }
    await service.createGeneratedClip({ ...clip, id: 'c'.repeat(24) });

    await expect(service.createUpload(owner, photo)).resolves.toBeDefined();
  });

  it('keeps another tenant from checking a clip', async () => {
    const { service } = setup();
    await service.createGeneratedClip({ ...clip, id: 'c'.repeat(24) });

    await expect(
      service.checkGeneratedClip('c'.repeat(24), {
        ...owner,
        organizationId: TENANT_B,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

describe('AssetsService', () => {
  it('rejects uploads without rights, of other types or over the limit', async () => {
    const { service } = setup();

    await expect(
      service.createUpload(owner, { ...photo, rightsConfirmed: false }),
    ).rejects.toThrow(ValidationError);
    await expect(
      service.createUpload(owner, { ...photo, contentType: 'image/gif' }),
    ).rejects.toThrow('This file type isn’t supported.');
    await expect(
      service.createUpload(owner, { ...photo, sizeBytes: 11 * 1024 * 1024 }),
    ).rejects.toThrow('Larger than 10 MB.');
    await expect(
      service.createUpload(owner, {
        ...photo,
        contentType: 'video/mp4',
        durationSeconds: 75,
      }),
    ).rejects.toThrow('Clips can be up to 60 seconds.');
  });

  it('chooses the storage key and binds the upload to the file', async () => {
    const { service, s3 } = setup();

    const ticket = await service.createUpload(owner, photo);

    expect(ticket.asset.status).toBe(AssetStatus.UPLOADING);
    expect(s3.createPresignedPutUrlForKey).toHaveBeenCalledWith(
      `projects/${PROJECT_ID}/assets/${ticket.asset.id}.jpg`,
      'image/jpeg',
      1_200_000,
    );
  });

  it('marks a verified upload ready and updates the project thumbnail', async () => {
    const { service, projectsService } = setup();
    const ticket = await service.createUpload(owner, photo);

    const asset = await service.completeUpload(ticket.asset.id, owner);

    expect(asset.status).toBe(AssetStatus.READY);
    expect(projectsService.syncMedia).toHaveBeenCalledWith(
      PROJECT_ID,
      owner,
      `projects/${PROJECT_ID}/assets/${ticket.asset.id}.jpg`,
      1,
    );
  });

  it('discards an upload whose stored size does not match', async () => {
    const { service, repository, s3 } = setup(999);
    const ticket = await service.createUpload(owner, photo);

    await expect(
      service.completeUpload(ticket.asset.id, owner),
    ).rejects.toThrow(ConflictError);
    expect(s3.deleteObject).toHaveBeenCalled();
    expect(repository.records).toHaveLength(0);
  });

  it('accepts audio only for a recording or music, within its limits', async () => {
    const { service } = setup();

    await expect(
      service.createUpload(owner, {
        ...narration,
        purpose: AssetPurpose.MEDIA,
      }),
    ).rejects.toThrow('This file type isn’t supported.');
    await expect(
      service.createUpload(owner, { ...photo, purpose: AssetPurpose.MUSIC }),
    ).rejects.toThrow('This file type isn’t supported.');
    await expect(
      service.createUpload(owner, {
        ...narration,
        sizeBytes: 21 * 1024 * 1024,
      }),
    ).rejects.toThrow('Larger than 20 MB.');
    await expect(
      service.createUpload(owner, { ...narration, durationSeconds: 95 }),
    ).rejects.toThrow('Recordings can be up to 90 seconds.');
    await expect(
      service.createUpload(owner, {
        ...narration,
        purpose: AssetPurpose.MUSIC,
        durationSeconds: 180,
      }),
    ).resolves.toBeDefined();
  });

  it('stores audio under its own prefix, outside the 20-file media limit', async () => {
    const { service, repository, s3 } = setup();
    for (let index = 0; index < 20; index += 1) {
      repository.records.push(readyMedia(index));
    }

    await expect(service.createUpload(owner, photo)).rejects.toThrow(
      'You can upload up to 20 files per project.',
    );
    const ticket = await service.createUpload(owner, narration);

    expect(ticket.asset).toMatchObject({
      kind: AssetKind.AUDIO,
      purpose: AssetPurpose.RECORDING,
      durationSeconds: 31,
    });
    expect(s3.createPresignedPutUrlForKey).toHaveBeenLastCalledWith(
      `projects/${PROJECT_ID}/audio/${ticket.asset.id}.m4a`,
      'audio/x-m4a',
      900_000,
    );
  });

  it('keeps one current recording and never lists audio with the media', async () => {
    const { service, repository, projectsService, s3 } = setup();
    repository.records.push(readyMedia(0));
    s3.headObject.mockResolvedValue({
      contentLength: 900_000,
      contentType: 'audio/x-m4a',
    });
    const music = await service.createUpload(owner, {
      ...narration,
      purpose: AssetPurpose.MUSIC,
    });
    await service.completeUpload(music.asset.id, owner);
    const first = await service.createUpload(owner, narration);
    await service.completeUpload(first.asset.id, owner);
    const second = await service.createUpload(owner, narration);

    await service.completeUpload(second.asset.id, owner);

    expect(repository.records.map((record) => record.id).sort()).toEqual(
      [readyMedia(0).id, music.asset.id, second.asset.id].sort(),
    );
    expect(s3.deleteObject).toHaveBeenCalledWith(
      `projects/${PROJECT_ID}/audio/${first.asset.id}.m4a`,
    );
    expect(projectsService.syncMedia).not.toHaveBeenCalled();
    await expect(service.list(PROJECT_ID, owner)).resolves.toEqual([
      expect.objectContaining({
        id: readyMedia(0).id,
        purpose: AssetPurpose.MEDIA,
      }),
    ]);
  });

  it('treats a file from another tenant as not found', async () => {
    const { service } = setup();
    const ticket = await service.createUpload(owner, photo);

    await expect(
      service.remove(ticket.asset.id, { ...owner, organizationId: TENANT_B }),
    ).rejects.toThrow(NotFoundError);
    await expect(service.remove(ticket.asset.id, owner)).resolves.toBe(true);
  });
});
