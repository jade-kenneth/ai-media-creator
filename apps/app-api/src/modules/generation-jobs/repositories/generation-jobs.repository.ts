import { Connection, type FilterQuery } from 'mongoose';
import type {
  GenerationFailureCode,
  GenerationJobStatus,
  GenerationJobType,
  SceneClipMode,
} from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';

export interface GenerationJobInput {
  versionId: string | null;
  hookId: string | null;
  sceneId: string | null;
  /** GENERATE_SCENE_CLIPS: the creator's photo the clips start from. */
  sourceAssetId?: string | null;
  /** GENERATE_SCENE_CLIPS: the motion description. */
  prompt?: string | null;
  /** GENERATE_SCENE_CLIPS: missing on jobs from before modes; read as FIRST_FRAME. */
  clipMode?: SceneClipMode | null;
  /** GENERATE_SCENE_CLIPS: missing on jobs from before the count; read as 2. */
  clipCount?: number | null;
  /** GENERATE_SCENE_CLIPS: each clip's length, from its scene; missing means 6. */
  clipSeconds?: number | null;
  /** GENERATE_SCENE_CLIPS, FIRST_LAST_FRAME: the end photo. */
  endAssetId?: string | null;
  /** GENERATE_SCENE_CLIPS, REFERENCES and CONSISTENT: the reference photos, in order. */
  referenceAssetIds?: string[] | null;
  /** GENERATE_SCENE_CLIPS, CONSISTENT: the scene whose still is sent last. */
  continuitySceneId?: string | null;
  /** GENERATE_SCENE_CLIPS, CONSISTENT: that scene's photo or clip. */
  continuityAssetId?: string | null;
  /** GENERATE_SCENE_CLIPS, CONSISTENT: where in that clip the still is taken; null for a photo. */
  continuitySeconds?: number | null;
}

export interface GenerationJobRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  projectId: string;
  projectTitle: string;
  type: GenerationJobType;
  label: string;
  status: GenerationJobStatus;
  step: number;
  stepCount: number;
  input: GenerationJobInput;
  idempotencyKey: string;
  creditCost: number;
  attempts: number;
  leaseUntil: Date | null;
  failureCode: GenerationFailureCode | null;
  failureMessage: string | null;
  resultVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface GenerationJobsRepository extends Repository<GenerationJobRecord> {
  /**
   * Claims the oldest runnable job of the given types — queued, or running
   * with an expired lease after a crash — by moving it to RUNNING with a new
   * lease. The status and lease in the match make the claim atomic across
   * replicas.
   */
  claimNext(
    now: Date,
    leaseUntil: Date,
    types: readonly GenerationJobType[],
  ): Promise<GenerationJobRecord | null>;
}

class MongooseGenerationJobsRepository
  extends MongooseRepository<GenerationJobRecord>
  implements GenerationJobsRepository
{
  async claimNext(
    now: Date,
    leaseUntil: Date,
    types: readonly GenerationJobType[],
  ): Promise<GenerationJobRecord | null> {
    const runnable: FilterQuery<GenerationJobRecord> = {
      type: { $in: [...types] },
      $or: [
        { status: 'QUEUED' },
        { status: 'RUNNING', leaseUntil: { $lt: now } },
      ],
    };
    const document = await this.model.findOneAndUpdate(
      runnable,
      {
        $set: { status: 'RUNNING', leaseUntil, startedAt: now, updatedAt: now },
        $inc: { attempts: 1 },
      },
      { sort: { createdAt: 1 }, new: true },
    );

    if (!document) return null;

    const {
      _id: _ignoredId,
      __v: _ignoredVersion,
      ...record
    } = document.toObject() as GenerationJobRecord & {
      _id?: unknown;
      __v?: unknown;
    };

    return record;
  }
}

export async function GenerationJobsRepositoryFactory(
  connection: Connection,
): Promise<GenerationJobsRepository> {
  return new MongooseGenerationJobsRepository(
    connection,
    'GenerationJobs',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      projectId: { type: String, required: true },
      projectTitle: { type: String, required: true },
      type: { type: String, required: true },
      label: { type: String, required: true },
      status: { type: String, required: true },
      step: { type: Number, default: 0 },
      stepCount: { type: Number, required: true },
      input: {
        versionId: { type: String, default: null },
        hookId: { type: String, default: null },
        sceneId: { type: String, default: null },
        sourceAssetId: { type: String, default: null },
        prompt: { type: String, default: null },
        clipMode: { type: String, default: null },
        clipCount: { type: Number, default: null },
        clipSeconds: { type: Number, default: null },
        endAssetId: { type: String, default: null },
        referenceAssetIds: { type: [String], default: undefined },
        continuitySceneId: { type: String, default: null },
        continuityAssetId: { type: String, default: null },
        continuitySeconds: { type: Number, default: null },
      },
      idempotencyKey: { type: String, required: true },
      creditCost: { type: Number, required: true },
      attempts: { type: Number, default: 0 },
      leaseUntil: { type: Date, default: null },
      failureCode: { type: String, default: null },
      failureMessage: { type: String, default: null },
      resultVersionId: { type: String, default: null },
      createdAt: Date,
      updatedAt: Date,
      startedAt: { type: Date, default: null },
      finishedAt: { type: Date, default: null },
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ ownerId: 1, idempotencyKey: 1 }, { unique: true }],
      [{ organizationId: 1, projectId: 1, createdAt: -1 }],
      [{ status: 1, createdAt: 1 }],
      [{ status: 1, type: 1, createdAt: 1 }],
    ],
  );
}
