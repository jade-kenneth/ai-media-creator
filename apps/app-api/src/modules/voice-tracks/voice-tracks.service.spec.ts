import { fakeRepository } from '../../../test/fake-repository';
import { VoiceSource } from 'src/graphql/generated/graphql';
import type { S3Service } from '../s3/s3.service';
import type { VoiceService } from '../voice/voice.service';
import type {
  VoiceTrackRecord,
  VoiceTracksRepository,
} from './repositories/voice-tracks.repository';
import { VoiceTracksService } from './voice-tracks.service';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';
const owner = { ownerId: 'user-1', organizationId: TENANT_A };
const PROJECT_ID = 'a'.repeat(24);
const recordingKey = `projects/${PROJECT_ID}/audio/${'r'.repeat(24)}.m4a`;

const track: VoiceTrackRecord = {
  id: 't'.repeat(24),
  ...owner,
  projectId: PROJECT_ID,
  source: VoiceSource.RECORDING,
  scriptVersionId: 'v'.repeat(24),
  scriptVersionNumber: 3,
  voiceId: null,
  voiceName: null,
  speed: 1,
  settingsKey: '',
  recordingAssetId: 'r'.repeat(24),
  recordingFileName: 'narration.m4a',
  alignmentLoss: 0.2,
  segments: [
    {
      sceneId: 's1',
      audioKey: recordingKey,
      offsetMs: 0,
      durationMs: 2500,
      words: [],
    },
    {
      sceneId: 's2',
      audioKey: recordingKey,
      offsetMs: 2500,
      durationMs: 3500,
      words: [],
    },
  ],
  durationMs: 6000,
  createdAt: new Date(),
};

function setup() {
  const repository = fakeRepository<VoiceTrackRecord>();
  const s3 = {
    createPresignedGetUrl: jest.fn(
      async (key: string) => `https://signed.example/${key}`,
    ),
  };
  const service = new VoiceTracksService(
    repository as unknown as VoiceTracksRepository,
    { listVoices: jest.fn(async () => []) } as unknown as VoiceService,
    s3 as unknown as S3Service,
  );

  return { service, s3 };
}

describe('VoiceTracksService', () => {
  it('signs each audio file once and keeps scene offsets', async () => {
    const { service, s3 } = setup();

    const presented = await service.present(track);

    expect(s3.createPresignedGetUrl).toHaveBeenCalledTimes(1);
    expect(presented.segments).toEqual([
      {
        sceneId: 's1',
        audioUrl: `https://signed.example/${recordingKey}`,
        offsetMs: 0,
        durationMs: 2500,
      },
      {
        sceneId: 's2',
        audioUrl: `https://signed.example/${recordingKey}`,
        offsetMs: 2500,
        durationMs: 3500,
      },
    ]);
  });

  it('treats a track from another tenant as not found', async () => {
    const { service } = setup();
    await service.create(track);

    await expect(
      service.findRecord(track.id, { ...owner, organizationId: TENANT_B }),
    ).resolves.toBeNull();
    await expect(service.findRecord(track.id, owner)).resolves.toMatchObject({
      id: track.id,
    });
  });
});
