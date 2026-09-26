import { Connection } from 'mongoose';
import type { CreditEntryKind } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';

/** Append-only record of every credit movement, for usage and cost review. */
export interface CreditEntryRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  projectId: string | null;
  projectTitle: string | null;
  jobId: string | null;
  kind: CreditEntryKind;
  amount: number;
  label: string;
  createdAt: Date;
}

export type CreditsLedgerRepository = Repository<CreditEntryRecord>;

export async function CreditsLedgerRepositoryFactory(
  connection: Connection,
): Promise<CreditsLedgerRepository> {
  return new MongooseRepository<CreditEntryRecord>(
    connection,
    'CreditEntries',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      projectId: { type: String, default: null },
      projectTitle: { type: String, default: null },
      jobId: { type: String, default: null },
      kind: { type: String, required: true },
      amount: { type: Number, required: true },
      label: { type: String, required: true },
      createdAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ organizationId: 1, ownerId: 1, createdAt: -1 }],
      [{ jobId: 1, kind: 1 }],
    ],
  );
}
