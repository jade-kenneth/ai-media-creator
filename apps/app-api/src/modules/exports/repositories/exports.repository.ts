import { Connection } from 'mongoose';
import type { ExportPreset } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';
import type { ExportSnapshot } from '../../video-edits/video-edits.service';

/** Immutable apart from `downloadedAt`. */
export interface ExportRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  projectId: string;
  number: number;
  jobId: string;
  scriptVersionId: string;
  preset: ExportPreset;
  videoKey: string;
  posterKey: string;
  durationMs: number;
  width: number;
  height: number;
  sizeBytes: number;
  snapshot: ExportSnapshot;
  /** What the video depended on; compared to tell when it changed since. */
  fingerprint: string;
  createdAt: Date;
  downloadedAt: Date | null;
}

export type ExportsRepository = Repository<ExportRecord>;

export async function ExportsRepositoryFactory(
  connection: Connection,
): Promise<ExportsRepository> {
  return new MongooseRepository<ExportRecord>(
    connection,
    'Exports',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      projectId: { type: String, required: true },
      number: { type: Number, required: true },
      jobId: { type: String, required: true },
      scriptVersionId: { type: String, required: true },
      preset: { type: String, required: true },
      videoKey: { type: String, required: true },
      posterKey: { type: String, required: true },
      durationMs: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      sizeBytes: { type: Number, required: true },
      snapshot: { type: Object, required: true },
      fingerprint: { type: String, required: true },
      createdAt: Date,
      downloadedAt: { type: Date, default: null },
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ organizationId: 1, projectId: 1, number: 1 }, { unique: true }],
      [{ jobId: 1 }, { unique: true }],
    ],
  );
}
