import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  AssetPurpose,
  GenerationFailureCode,
  GenerationJobType,
  VoiceSource,
} from 'src/graphql/generated/graphql';
import { AssetsService } from '../assets/assets.service';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import {
  GenerationJobError,
  type GenerationJobContext,
  type GenerationJobResult,
} from '../generation-jobs/generation-jobs.types';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import { RenderProbe } from '../render/render.probe';
import { S3Service } from '../s3/s3.service';
import { VoiceService } from '../voice/voice.service';
import type {
  VoiceSegmentRecord,
  VoiceTrackRecord,
} from '../voice-tracks/repositories/voice-tracks.repository';
import { VoiceTracksService } from '../voice-tracks/voice-tracks.service';
import type { VideoEditSceneRecord } from './repositories/video-edits.repository';
import { VideoEditsService, voiceSettingsKey } from './video-edits.service';
import {
  applyPronunciations,
  matchAlignedWords,
  scriptWordTimings,
  tokenize,
  wordsFromCharacters,
  type TimedWord,
} from './voice-timing';

/**
 * Runs the paid voice jobs in the media worker (Product Specification
 * §3.14). Provider calls come first; audio is stored and the track recorded
 * only after every scene succeeded, so a failure leaves the video untouched.
 */
@Injectable()
export class VoiceoverJobsHandler implements OnModuleInit {
  private readonly logger = new Logger(VoiceoverJobsHandler.name);

  constructor(
    private readonly handlers: GenerationJobHandlers,
    private readonly videoEditsService: VideoEditsService,
    private readonly voiceTracksService: VoiceTracksService,
    private readonly voiceService: VoiceService,
    private readonly assetsService: AssetsService,
    private readonly s3Service: S3Service,
    private readonly probe: RenderProbe,
  ) {}

  onModuleInit(): void {
    this.handlers.register(GenerationJobType.GENERATE_VOICEOVER, {
      run: (job, context) => this.generate(job, context),
    });
    this.handlers.register(GenerationJobType.ALIGN_RECORDING, {
      run: (job, context) => this.align(job, context),
    });
  }

  async generate(
    job: GenerationJobRecord,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const owner = { ownerId: job.ownerId, organizationId: job.organizationId };
    const record = await this.videoEditsService.recordFor(job.projectId, owner);
    const voice = record.voice;

    if (!voice?.voiceId) {
      throw new GenerationJobError(
        GenerationFailureCode.PROVIDER_REJECTED,
        'No voice was chosen.',
      );
    }

    const voiceId = voice.voiceId;
    // A scene with no narration (a skit's) gets no voice and plays silent.
    const narrated = record.scenes.filter((scene) => scene.narration.trim());
    const spoken = narrated.map((scene) =>
      applyPronunciations(scene.narration, voice.pronunciations),
    );

    await context.setStep(1);

    const results: {
      scene: VideoEditSceneRecord;
      audio: Buffer;
      durationMs: number;
      words: TimedWord[];
    }[] = [];
    for (const [index, scene] of narrated.entries()) {
      const speech = await this.voiceService.speak({
        voiceId,
        text: spoken[index].spoken,
        speed: voice.speed,
        previousText: spoken[index - 1]?.spoken,
        nextText: spoken[index + 1]?.spoken,
      });
      const words = wordsFromCharacters(speech.characters);
      const durationMs = Math.max(
        1,
        ...speech.characters.map((character) =>
          Math.round(character.end * 1000),
        ),
      );

      results.push({
        scene,
        audio: speech.audio,
        durationMs,
        words: scriptWordTimings(
          scene.narration,
          words,
          spoken[index].source,
          durationMs,
        ),
      });
    }

    await context.setStep(2);

    const trackId = new Types.ObjectId().toHexString();
    const segments: VoiceSegmentRecord[] = results.map((result) => ({
      sceneId: result.scene.sceneId,
      audioKey: `projects/${job.projectId}/voice/${trackId}/${new Types.ObjectId().toHexString()}.mp3`,
      offsetMs: 0,
      durationMs: result.durationMs,
      words: result.words,
    }));
    const voiceName =
      (await this.voiceService.listVoices()).find(
        (option) => option.id === voiceId,
      )?.name ?? null;

    await this.storeTrack(
      segments,
      results.map((result) => result.audio),
      {
        id: trackId,
        ownerId: job.ownerId,
        organizationId: job.organizationId,
        projectId: job.projectId,
        source: VoiceSource.AI,
        scriptVersionId: record.scriptVersionId,
        scriptVersionNumber: record.scriptVersionNumber,
        voiceId,
        voiceName,
        speed: voice.speed,
        settingsKey: voiceSettingsKey(voice),
        recordingAssetId: null,
        recordingFileName: null,
        alignmentLoss: null,
        segments,
        durationMs: segments.reduce(
          (total, segment) => total + segment.durationMs,
          0,
        ),
        createdAt: new Date(),
      },
      owner,
    );

    return {};
  }

  async align(
    job: GenerationJobRecord,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const owner = { ownerId: job.ownerId, organizationId: job.organizationId };
    const record = await this.videoEditsService.recordFor(job.projectId, owner);
    const recording = await this.assetsService.currentAudioRecord(
      job.projectId,
      AssetPurpose.RECORDING,
      owner,
    );
    const audio = recording
      ? await this.s3Service.getObjectBuffer(recording.storageKey)
      : null;

    if (!recording || !audio) {
      throw new GenerationJobError(
        GenerationFailureCode.MEDIA_MISSING,
        'The recording is no longer stored.',
      );
    }

    const extension = recording.storageKey.split('.').pop() ?? 'm4a';
    const seconds = await this.probe.durationSeconds(audio, extension);

    if (!seconds) {
      throw new GenerationJobError(
        GenerationFailureCode.UNREADABLE_MEDIA,
        'We couldn’t read that audio file.',
      );
    }

    await context.setStep(1);

    // A scene with no narration (a skit's) gets no segment and plays silent.
    const narrated = record.scenes.filter((scene) => scene.narration.trim());
    const sceneTokens = narrated.map((scene) => tokenize(scene.narration));
    const alignment = await this.voiceService.align(
      audio,
      recording.fileName,
      sceneTokens.flat().join(' '),
    );
    const words = matchAlignedWords(sceneTokens.flat(), alignment.words);

    if (!words) {
      throw new GenerationJobError(
        GenerationFailureCode.RECORDING_MISMATCH,
        'The recording doesn’t match the script closely enough.',
      );
    }

    const totalMs = Math.round(seconds * 1000);
    let cursor = 0;
    const offsets: number[] = [];
    const sceneWords = sceneTokens.map((tokens, index) => {
      const slice = words.slice(cursor, cursor + tokens.length);
      cursor += tokens.length;
      offsets.push(index === 0 ? 0 : (slice[0]?.startMs ?? offsets[index - 1]));
      return slice;
    });
    const segments: VoiceSegmentRecord[] = narrated.map((scene, index) => {
      const offsetMs = offsets[index];
      const endMs = offsets[index + 1] ?? totalMs;

      return {
        sceneId: scene.sceneId,
        audioKey: recording.storageKey,
        offsetMs,
        durationMs: Math.max(1, endMs - offsetMs),
        words: sceneWords[index].map((word) => ({
          text: word.text,
          startMs: Math.max(0, word.startMs - offsetMs),
          endMs: Math.max(0, word.endMs - offsetMs),
        })),
      };
    });

    await this.storeTrack(
      [],
      [],
      {
        id: new Types.ObjectId().toHexString(),
        ownerId: job.ownerId,
        organizationId: job.organizationId,
        projectId: job.projectId,
        source: VoiceSource.RECORDING,
        scriptVersionId: record.scriptVersionId,
        scriptVersionNumber: record.scriptVersionNumber,
        voiceId: null,
        voiceName: null,
        speed: 1,
        settingsKey: '',
        recordingAssetId: recording.id,
        recordingFileName: recording.fileName,
        alignmentLoss: alignment.loss,
        segments,
        durationMs: totalMs,
        createdAt: new Date(),
      },
      owner,
    );

    return {};
  }

  /** Uploads generated audio, records the track and points the video at it. */
  private async storeTrack(
    uploads: VoiceSegmentRecord[],
    audio: Buffer[],
    track: VoiceTrackRecord,
    owner: { ownerId: string; organizationId: string | null },
  ): Promise<void> {
    const stored: string[] = [];

    try {
      for (const [index, segment] of uploads.entries()) {
        await this.s3Service.putObject(
          segment.audioKey,
          audio[index],
          'audio/mpeg',
        );
        stored.push(segment.audioKey);
      }
      await this.voiceTracksService.create(track);
    } catch (error) {
      for (const key of stored) {
        await this.s3Service
          .deleteObject(key)
          .catch(() =>
            this.logger.warn(`Could not remove unused voice audio ${key}.`),
          );
      }
      throw error;
    }

    await this.videoEditsService.applyTrack(track, owner);
  }
}
