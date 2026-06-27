import { Connection, Types } from 'mongoose';
import type { AccountDeletionRequest } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/moongose-repository';
import { Repository } from 'src/libs/repository';

export interface AccountDeletionRequestRecord
  extends Omit<
    AccountDeletionRequest,
    '__typename' | 'reviewNote' | 'reviewedBy' | 'reviewedAt'
  > {
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
}

export type AccountDeletionRequestsRepository =
  Repository<AccountDeletionRequestRecord>;

export async function AccountDeletionRequestsRepositoryFactory(
  connection: Connection,
): Promise<AccountDeletionRequestsRepository> {
  return new MongooseRepository<AccountDeletionRequestRecord>(
    connection,
    'AccountDeletionRequests',
    {
      id: Types.ObjectId,
      fullName: String,
      email: String,
      organizationId: String,
      organizationName: String,
      status: String,
      reviewNote: {
        type: String,
        default: null,
      },
      reviewedBy: {
        type: String,
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ email: 1, status: 1, createdAt: -1 }],
      [{ organizationId: 1, status: 1, createdAt: -1 }],
      [{ status: 1, createdAt: -1 }],
      [{ createdAt: -1 }],
    ],
  );
}
