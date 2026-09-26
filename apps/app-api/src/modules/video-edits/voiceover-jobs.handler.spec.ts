import {
  AssetPurpose,
  GenerationFailureCode,
  ScenePurpose,
  VoiceSource,
} from 'src/graphql/generated/graphql';
import type { AssetsService } from '../assets/assets.service';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import { GenerationJobError } from '../generation-jobs/generation-jobs.types';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import type { RenderProbe } from '../render/render.probe';
import type { S3Service } from '../s3/s3.service';
import type { VoiceService } from '../voice/voice.service';
import { voiceProviderErrors } from '../voice/voice.types';
import type { VoiceTrackRecord } from '../voice-tracks/repositories/voice-tracks.repository';
import type { VoiceTracksService } from '../voice-tracks/voice-tracks.service';
import type { VideoEditRecord } from './repositories/video-edits.repository';
import type { VideoEditsService } from './video-edits.service';
import { VoiceoverJobsHandler } from './voiceover-jobs.handler';

const PROJECT_ID = 'a'.repeat(24);
const owner = { ownerId: 'user-1', organizationId: 'org-a' };

const video: VideoEditRecord = {
  id: 'e'.repeat(24),
  ...owner,
  projectId: PROJECT_ID,
  scriptVersionId: 'v'.repeat(24),
  scriptVersionNumber: 3,
  scenes: [
    ['Ang BlendGo, kasya sa bag.', ScenePurpose.HOOK],
    ['I-charge sa USB-C.', ScenePurpose.CALL_TO_ACTION],
  ].map(([narration, purpose], index) => ({
    sceneId: String(index + 1).padStart(24, '0'),
    order: index + 1,
    purpose: purpose as ScenePurpose,
    narration: narration as string,
    visual: '',
    onScreenText: '',
    cta: null,
    durationSeconds: 5,
    media: null,
  })),
  voice: {
    source: VoiceSource.AI,
    voiceId: 'voice-ava',
    speed: 1.1,
    pronunciations: [{ word: 'BlendGo', sayAs: 'BLEND-go' }],
    trackId: null,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const job = {
  id: 'job-1',
  ...owner,
  projectId: PROJECT_ID,
} as unknown as GenerationJobRecord;

function characters(text: string) {
  return [...text].map((character, index) => ({
    text: character,
    start: index * 0.05,
    end: (index + 1) * 0.05,
  }));
}

function setup() {
  const stored = new Map<string, Buffer>();
  const created: VoiceTrackRecord[] = [];
  const voiceService = {
    speak: jest.fn(async (request: { text: string }) => ({
      audio: Buffer.from(request.text),
      characters: characters(request.text),
    })),
    align: jest.fn(async (_audio: Buffer, _name: string, text: string) => ({
      words: text.split(' ').map((word, index) => ({
        text: word.replace(/[^\p{L}\p{N}-]/gu, ''),
        start: index * 0.5,
        end: index * 0.5 + 0.4,
      })),
      loss: 0.2,
    })),
    listVoices: jest.fn(async () => [
      { id: 'voice-ava', name: 'Ava', descriptor: '', sampleUrl: null },
    ]),
  };
  const s3 = {
    putObject: jest.fn(async (key: string, body: Buffer) => {
      stored.set(key, body);
    }),
    deleteObject: jest.fn(async (key: string) => {
      stored.delete(key);
    }),
    getObjectBuffer: jest.fn(async () => Buffer.from('recording')),
  };
  const recording = {
    id: 'r'.repeat(24),
    fileName: 'narration.m4a',
    storageKey: `projects/${PROJECT_ID}/audio/${'r'.repeat(24)}.m4a`,
  };
  const assets = {
    currentAudioRecord: jest.fn(async () => recording),
  };
  const probe = { durationSeconds: jest.fn(async () => 6) };
  const tracks = {
    create: jest.fn(async (record: VoiceTrackRecord) => {
      created.push(record);
      return record;
    }),
  };
  const edits = {
    recordFor: jest.fn(async () => video),
    applyTrack: jest.fn(async () => undefined),
  };
  const handler = new VoiceoverJobsHandler(
    new GenerationJobHandlers(),
    edits as unknown as VideoEditsService,
    tracks as unknown as VoiceTracksService,
    voiceService as unknown as VoiceService,
    assets as unknown as AssetsService,
    s3 as unknown as S3Service,
    probe as unknown as RenderProbe,
  );
  const context = { setStep: jest.fn(async () => undefined) };

  return {
    handler,
    context,
    voiceService,
    s3,
    stored,
    created,
    edits,
    tracks,
    probe,
    assets,
  };
}

describe('VoiceoverJobsHandler', () => {
  it('voices each scene with its neighbours, speaks pronunciations, and stores one segment per scene', async () => {
    const { handler, context, voiceService, stored, created, edits } = setup();

    await handler.generate(job, context);

    expect(voiceService.speak).toHaveBeenNthCalledWith(1, {
      voiceId: 'voice-ava',
      text: 'Ang BLEND-go, kasya sa bag.',
      speed: 1.1,
      previousText: undefined,
      nextText: 'I-charge sa USB-C.',
    });
    expect(voiceService.speak).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ previousText: 'Ang BLEND-go, kasya sa bag.' }),
    );
    expect(context.setStep.mock.calls).toEqual([[1], [2]]);

    const [track] = created;
    expect(track).toMatchObject({
      source: VoiceSource.AI,
      voiceName: 'Ava',
      scriptVersionNumber: 3,
      speed: 1.1,
    });
    expect(track.segments.map((segment) => segment.sceneId)).toEqual(
      video.scenes.map((scene) => scene.sceneId),
    );
    expect(track.segments[0].words.map((word) => word.text)).toEqual([
      'Ang',
      'BlendGo,',
      'kasya',
      'sa',
      'bag.',
    ]);
    for (const segment of track.segments) {
      expect(segment.audioKey).toMatch(
        new RegExp(
          `^projects/${PROJECT_ID}/voice/${track.id}/[a-f0-9]{24}\\.mp3$`,
        ),
      );
      expect(stored.has(segment.audioKey)).toBe(true);
    }
    expect(edits.applyTrack).toHaveBeenCalledWith(track, owner);
  });

  it('stores nothing when the voice service fails part-way', async () => {
    const { handler, context, voiceService, s3, created } = setup();
    voiceService.speak
      .mockResolvedValueOnce({
        audio: Buffer.from('one'),
        characters: characters('one'),
      })
      .mockRejectedValueOnce(voiceProviderErrors.timeout());

    await expect(handler.generate(job, context)).rejects.toMatchObject({
      code: GenerationFailureCode.PROVIDER_TIMEOUT,
    });
    expect(s3.putObject).not.toHaveBeenCalled();
    expect(created).toHaveLength(0);
  });

  it('removes uploaded audio when the track cannot be recorded', async () => {
    const { handler, context, tracks, stored, s3 } = setup();
    tracks.create.mockRejectedValueOnce(new Error('database down'));

    await expect(handler.generate(job, context)).rejects.toThrow(
      'database down',
    );
    expect(s3.deleteObject).toHaveBeenCalledTimes(2);
    expect(stored.size).toBe(0);
  });

  it('times a recording into contiguous scene segments', async () => {
    const { handler, context, created, voiceService } = setup();

    await handler.align(job, context);

    expect(voiceService.align).toHaveBeenCalledWith(
      expect.any(Buffer),
      'narration.m4a',
      'Ang BlendGo, kasya sa bag. I-charge sa USB-C.',
    );
    const [track] = created;
    expect(track).toMatchObject({
      source: VoiceSource.RECORDING,
      recordingAssetId: 'r'.repeat(24),
      durationMs: 6000,
      alignmentLoss: 0.2,
    });
    expect(
      track.segments.map((segment) => [segment.offsetMs, segment.durationMs]),
    ).toEqual([
      [0, 2500],
      [2500, 3500],
    ]);
    expect(track.segments[1].words[0]).toEqual({
      text: 'I-charge',
      startMs: 0,
      endMs: 400,
    });
  });

  it('gives a scene with no narration no voice, and voices the rest as neighbours', async () => {
    const { handler, context, voiceService, created, edits } = setup();
    const [first, last] = video.scenes;
    const silent = {
      ...first,
      sceneId: '9'.repeat(24),
      narration: '  ',
      lines: [{ speaker: 'Ana', text: 'Uy!' }],
    };
    edits.recordFor.mockResolvedValue({
      ...video,
      scenes: [first, silent, last],
    });

    await handler.generate(job, context);
    await handler.align(job, context);

    expect(voiceService.speak).toHaveBeenCalledTimes(2);
    expect(voiceService.speak).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ nextText: 'I-charge sa USB-C.' }),
    );
    expect(voiceService.align).toHaveBeenCalledWith(
      expect.any(Buffer),
      'narration.m4a',
      'Ang BlendGo, kasya sa bag. I-charge sa USB-C.',
    );
    for (const track of created) {
      expect(track.segments.map((segment) => segment.sceneId)).toEqual([
        first.sceneId,
        last.sceneId,
      ]);
    }
    expect(
      created[1].segments.map((segment) => [
        segment.offsetMs,
        segment.durationMs,
      ]),
    ).toEqual([
      [0, 2500],
      [2500, 3500],
    ]);
  });

  it('fails a recording that does not follow the script, or cannot be read', async () => {
    const mismatch = setup();
    mismatch.voiceService.align.mockResolvedValueOnce({
      words: [{ text: 'hello', start: 0, end: 1 }],
      loss: 3,
    });

    await expect(
      mismatch.handler.align(job, mismatch.context),
    ).rejects.toMatchObject({
      code: GenerationFailureCode.RECORDING_MISMATCH,
    });

    const unreadable = setup();
    unreadable.probe.durationSeconds.mockResolvedValueOnce(null as never);

    const error = await unreadable.handler
      .align(job, unreadable.context)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(GenerationJobError);
    expect((error as GenerationJobError).code).toBe(
      GenerationFailureCode.UNREADABLE_MEDIA,
    );
    expect(unreadable.voiceService.align).not.toHaveBeenCalled();
    expect(unreadable.assets.currentAudioRecord).toHaveBeenCalledWith(
      PROJECT_ID,
      AssetPurpose.RECORDING,
      owner,
    );
  });
});
