import { Inject, Injectable } from '@nestjs/common';
import type { OwnerContext } from 'src/common/types/owner-context';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import type { VoiceOption, VoiceTrack } from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import { S3Service } from '../s3/s3.service';
import { VoiceService } from '../voice/voice.service';
import type {
  VoiceTrackRecord,
  VoiceTracksRepository,
} from './repositories/voice-tracks.repository';

@Injectable()
export class VoiceTracksService {
  constructor(
    @Inject(TOKENS.VOICE_TRACKS_REPOSITORY)
    private readonly tracks: VoiceTracksRepository,
    private readonly voiceService: VoiceService,
    private readonly s3Service: S3Service,
  ) {}

  async options(): Promise<VoiceOption[]> {
    const voices = await this.voiceService.listVoices();

    return voices.map((voice) => ({
      id: voice.id,
      name: voice.name,
      descriptor: voice.descriptor,
      sampleUrl: voice.sampleUrl,
    }));
  }

  async create(record: VoiceTrackRecord): Promise<VoiceTrackRecord> {
    return this.tracks.create(record);
  }

  async findRecord(
    id: string,
    owner: OwnerContext,
  ): Promise<VoiceTrackRecord | null> {
    const [record] = await this.tracks
      .list(
        applyTenantFilter<VoiceTrackRecord>(
          { id, ownerId: owner.ownerId },
          owner.organizationId,
        ),
      )
      .collect();

    return record ?? null;
  }

  async present(record: VoiceTrackRecord): Promise<VoiceTrack> {
    const urls = new Map<string, string | null>();

    for (const key of new Set(
      record.segments.map((segment) => segment.audioKey),
    )) {
      urls.set(
        key,
        await this.s3Service.createPresignedGetUrl(key).catch(() => null),
      );
    }

    return {
      id: record.id,
      source: record.source,
      voiceName: record.voiceName,
      speed: record.speed,
      scriptVersionNumber: record.scriptVersionNumber,
      recordingFileName: record.recordingFileName,
      durationMs: record.durationMs,
      segments: record.segments.map((segment) => ({
        sceneId: segment.sceneId,
        audioUrl: urls.get(segment.audioKey) ?? null,
        offsetMs: segment.offsetMs,
        durationMs: segment.durationMs,
      })),
      createdAt: record.createdAt,
    };
  }
}
