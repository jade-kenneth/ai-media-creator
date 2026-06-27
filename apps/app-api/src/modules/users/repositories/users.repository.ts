import { Connection, Schema, Types } from 'mongoose';
import type { RegistrationReview, User } from 'src/graphql/generated/graphql';
import {
  RegistrationRejectionReason,
  RegistrationStatus,
} from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/moongose-repository';
import { Repository } from 'src/libs/repository';

export interface RegistrationReviewRecord extends Omit<
  RegistrationReview,
  'reviewedByUser'
> {
  reviewedByUser?: null;
}

export interface UserRecord extends Omit<
  User,
  'memberProfile' | 'registrationReview' | 'position'
> {
  passwordHash: string;
  registrationStatus: RegistrationStatus;
  registrationReview?: RegistrationReviewRecord | null;
  memberProfile?: null;
  organizationId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
}

export type UsersRepository = Repository<UserRecord>;

const RegistrationReviewSchema = new Schema<RegistrationReviewRecord>(
  {
    reviewedBy: String,
    reviewedAt: Date,
    rejectionReason: {
      type: String,
      enum: Object.values(RegistrationRejectionReason),
      default: null,
    },
    rejectionNote: String,
  },
  {
    _id: false,
    id: false,
  },
);

export async function UsersRepositoryFactory(
  connection: Connection,
): Promise<UsersRepository> {
  return new MongooseRepository<UserRecord>(
    connection,
    'Users',
    {
      id: Types.ObjectId,
      email: String,
      passwordHash: String,
      role: String,
      isActive: Boolean,
      registrationStatus: {
        type: String,
        enum: Object.values(RegistrationStatus),
        default: RegistrationStatus.pending_approval,
      },
      registrationReview: RegistrationReviewSchema,
      organizationId: String,
      firstName: String,
      lastName: String,
      position: String,
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ email: 1 }, { unique: true }],
      [{ organizationId: 1, registrationStatus: 1 }],
    ],
  );
}
