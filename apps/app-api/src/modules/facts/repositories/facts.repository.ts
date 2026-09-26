import { Connection } from 'mongoose';
import type {
  ClaimFlagCategory,
  FactSource,
  FactStatus,
} from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';

export interface ClaimFlagRecord {
  category: ClaimFlagCategory;
  lead: string;
  reason: string;
  claim: string;
}

export interface FactRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  projectId: string;
  /** The product feature this fact came from, if any. */
  featureId: string | null;
  text: string;
  source: FactSource;
  sourceUrl: string | null;
  sourceNote: string | null;
  status: FactStatus;
  note: string | null;
  flag: ClaimFlagRecord | null;
  createdAt: Date;
  updatedAt: Date;
}

export type FactsRepository = Repository<FactRecord>;

export async function FactsRepositoryFactory(
  connection: Connection,
): Promise<FactsRepository> {
  return new MongooseRepository<FactRecord>(
    connection,
    'ProductFacts',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      projectId: { type: String, required: true },
      featureId: { type: String, default: null },
      text: { type: String, required: true },
      source: { type: String, required: true },
      sourceUrl: { type: String, default: null },
      sourceNote: { type: String, default: null },
      status: { type: String, required: true },
      note: { type: String, default: null },
      flag: { type: Object, default: null },
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ organizationId: 1, projectId: 1, createdAt: 1 }],
    ],
  );
}
