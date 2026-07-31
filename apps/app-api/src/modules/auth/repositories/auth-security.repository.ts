import { Connection, Types } from 'mongoose';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import { Repository } from 'src/libs/repository';

export type AuthSecurityRecord = {
  id: string;
  email: string;
  loginFailures: number;
  failureWindowStartedAt: Date | null;
  blockedUntil: Date | null;
  resetCodeHash: string | null;
  resetCodeExpiresAt: Date | null;
  resetCodeUsedAt: Date | null;
  lastResetSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthSecurityRepository = Repository<AuthSecurityRecord>;

export async function AuthSecurityRepositoryFactory(
  connection: Connection,
): Promise<AuthSecurityRepository> {
  return new MongooseRepository<AuthSecurityRecord>(
    connection,
    'AuthSecurity',
    {
      id: Types.ObjectId,
      email: String,
      loginFailures: Number,
      failureWindowStartedAt: Date,
      blockedUntil: Date,
      resetCodeHash: String,
      resetCodeExpiresAt: Date,
      resetCodeUsedAt: Date,
      lastResetSentAt: Date,
      createdAt: Date,
      updatedAt: Date,
    },
    [[{ email: 1 }, { unique: true }], [{ blockedUntil: 1 }]],
  );
}
