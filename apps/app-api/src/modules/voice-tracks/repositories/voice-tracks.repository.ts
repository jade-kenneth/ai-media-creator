import { Connection } from 'mongoose';
import type { VoiceSource } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';

export interface VoiceWordRecord {
  text: string;
  /** Milliseconds from the start of the scene. */
  startMs: number;
  endMs: number;
}

export interface VoiceSegmentRecord {
  sceneId: string;
  /** A generated segment, or the creator's whole recording. */
  audioKey: string;
  /** Where the scene starts within the audio file. */
  offsetMs: number;
  durationMs: number;
  words: VoiceWordRecord[];
}

/** Immutable: settings changes and new versions make a new track. */
export interface VoiceTrackRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  projectId: string;
  source: VoiceSource.AI | VoiceSource.RECORDING;
  scriptVersionId: string;
  scriptVersionNumber: number;
  voiceId: string | null;
  voiceName: string | null;
  speed: number;
  /** Voice, speed and pronunciations the track was made with. */
  settingsKey: string;
  recordingAssetId: string | null;
  recordingFileName: string | null;
  /** The aligner's loss for a recording, kept to calibrate matching. */
  alignmentLoss: number | null;
  segments: VoiceSegmentRecord[];
  durationMs: number;
  createdAt: Date;
}

export type VoiceTracksRepository = Repository<VoiceTrackRecord>;

export async function VoiceTracksRepositoryFactory(
  connection: Connection,
): Promise<VoiceTracksRepository> {
  return new MongooseRepository<VoiceTrackRecord>(
    connection,
    'VoiceTracks',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      projectId: { type: String, required: true },
      source: { type: String, required: true },
      scriptVersionId: { type: String, required: true },
      scriptVersionNumber: { type: Number, required: true },
      voiceId: { type: String, default: null },
      voiceName: { type: String, default: null },
      speed: { type: Number, required: true },
      settingsKey: { type: String, required: true },
      recordingAssetId: { type: String, default: null },
      recordingFileName: { type: String, default: null },
      alignmentLoss: { type: Number, default: null },
      segments: [
        {
          _id: false,
          sceneId: String,
          audioKey: String,
          offsetMs: Number,
          durationMs: Number,
          words: [{ _id: false, text: String, startMs: Number, endMs: Number }],
        },
      ],
      durationMs: { type: Number, required: true },
      createdAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ organizationId: 1, projectId: 1, createdAt: -1 }],
    ],
  );
}
