import { Connection, Types, type FilterQuery } from 'mongoose';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';

export type AuthSecurityRecord = {
  id: string;
  email: string;
  loginFailures: number;
  failureWindowStartedAt: Date | null;
  blockedUntil: Date | null;
  resetCodeHash: string | null;
  resetCodeExpiresAt: Date | null;
  resetCodeUsedAt: Date | null;
  resetCodeFailures: number;
  resetCodeClaimId: string | null;
  resetCodeClaimedAt: Date | null;
  resetRequestReservationId: string | null;
  lastResetSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface RecordLoginFailureInput {
  email: string;
  now: Date;
  windowStartsAfter: Date;
  limit: number;
  blockedUntil: Date;
}

interface ReserveResetRequestInput {
  email: string;
  now: Date;
  eligibleBefore: Date;
  reservationId: string;
}

interface StoreResetCodeInput {
  email: string;
  reservationId: string;
  resetCodeHash: string;
  resetCodeExpiresAt: Date;
  now: Date;
}

interface RecordInvalidResetCodeAttemptInput {
  id: string;
  resetCodeHash: string;
  limit: number;
  now: Date;
}

interface ClaimResetCodeInput {
  id: string;
  resetCodeHash: string;
  claimId: string;
  failureLimit: number;
  now: Date;
}

export interface AuthSecurityRepository extends Repository<AuthSecurityRecord> {
  recordLoginFailure(input: RecordLoginFailureInput): Promise<void>;
  reserveResetRequest(input: ReserveResetRequestInput): Promise<boolean>;
  releaseResetRequest(reservationId: string, email: string): Promise<void>;
  storeResetCode(input: StoreResetCodeInput): Promise<boolean>;
  recordInvalidResetCodeAttempt(
    input: RecordInvalidResetCodeAttemptInput,
  ): Promise<void>;
  claimResetCode(input: ClaimResetCodeInput): Promise<boolean>;
  finalizeResetCodeClaim(
    id: string,
    claimId: string,
    now: Date,
  ): Promise<boolean>;
  releaseResetCodeClaim(id: string, claimId: string): Promise<void>;
}

class MongooseAuthSecurityRepository
  extends MongooseRepository<AuthSecurityRecord>
  implements AuthSecurityRepository
{
  async recordLoginFailure(input: RecordLoginFailureInput): Promise<void> {
    const withinWindow = {
      $and: [
        { $ne: [{ $ifNull: ['$failureWindowStartedAt', null] }, null] },
        { $gt: ['$failureWindowStartedAt', input.windowStartsAfter] },
      ],
    };
    const nextFailures = {
      $cond: [
        withinWindow,
        { $add: [{ $ifNull: ['$loginFailures', 0] }, 1] },
        1,
      ],
    };
    const update = [
      {
        $set: {
          id: { $ifNull: ['$id', new Types.ObjectId()] },
          email: { $ifNull: ['$email', input.email] },
          loginFailures: nextFailures,
          failureWindowStartedAt: {
            $cond: [withinWindow, '$failureWindowStartedAt', input.now],
          },
          blockedUntil: {
            $cond: [
              { $gte: [nextFailures, input.limit] },
              input.blockedUntil,
              null,
            ],
          },
          resetCodeHash: { $ifNull: ['$resetCodeHash', null] },
          resetCodeExpiresAt: { $ifNull: ['$resetCodeExpiresAt', null] },
          resetCodeUsedAt: { $ifNull: ['$resetCodeUsedAt', null] },
          resetCodeFailures: { $ifNull: ['$resetCodeFailures', 0] },
          resetCodeClaimId: { $ifNull: ['$resetCodeClaimId', null] },
          resetCodeClaimedAt: { $ifNull: ['$resetCodeClaimedAt', null] },
          resetRequestReservationId: {
            $ifNull: ['$resetRequestReservationId', null],
          },
          lastResetSentAt: { $ifNull: ['$lastResetSentAt', null] },
          createdAt: { $ifNull: ['$createdAt', input.now] },
          updatedAt: input.now,
        },
      },
    ];

    try {
      await this.model.findOneAndUpdate({ email: input.email }, update, {
        upsert: true,
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;

      await this.model.findOneAndUpdate({ email: input.email }, update);
    }
  }

  async reserveResetRequest(input: ReserveResetRequestInput): Promise<boolean> {
    const filter: FilterQuery<AuthSecurityRecord> = {
      email: input.email,
      resetCodeClaimId: null,
      $or: [
        { lastResetSentAt: null },
        { lastResetSentAt: { $lt: input.eligibleBefore } },
      ],
    };
    const update = [
      {
        $set: {
          id: { $ifNull: ['$id', new Types.ObjectId()] },
          email: { $ifNull: ['$email', input.email] },
          loginFailures: { $ifNull: ['$loginFailures', 0] },
          failureWindowStartedAt: {
            $ifNull: ['$failureWindowStartedAt', null],
          },
          blockedUntil: { $ifNull: ['$blockedUntil', null] },
          resetCodeHash: { $ifNull: ['$resetCodeHash', null] },
          resetCodeExpiresAt: { $ifNull: ['$resetCodeExpiresAt', null] },
          resetCodeUsedAt: { $ifNull: ['$resetCodeUsedAt', null] },
          resetCodeFailures: { $ifNull: ['$resetCodeFailures', 0] },
          resetCodeClaimId: null,
          resetCodeClaimedAt: null,
          resetRequestReservationId: input.reservationId,
          lastResetSentAt: input.now,
          createdAt: { $ifNull: ['$createdAt', input.now] },
          updatedAt: input.now,
        },
      },
    ];

    try {
      const reservation = await this.model.findOneAndUpdate(filter, update, {
        new: true,
        upsert: true,
      });

      return reservation !== null;
    } catch (error) {
      if (isDuplicateKeyError(error)) return false;
      throw error;
    }
  }

  async releaseResetRequest(
    reservationId: string,
    email: string,
  ): Promise<void> {
    await this.model.updateOne(
      { email, resetRequestReservationId: reservationId },
      {
        $set: {
          lastResetSentAt: null,
          resetRequestReservationId: null,
          updatedAt: new Date(),
        },
      },
    );
  }

  async storeResetCode(input: StoreResetCodeInput): Promise<boolean> {
    const result = await this.model.updateOne(
      {
        email: input.email,
        resetRequestReservationId: input.reservationId,
      },
      {
        $set: {
          resetCodeHash: input.resetCodeHash,
          resetCodeExpiresAt: input.resetCodeExpiresAt,
          resetCodeUsedAt: null,
          resetCodeFailures: 0,
          resetCodeClaimId: null,
          resetCodeClaimedAt: null,
          resetRequestReservationId: null,
          updatedAt: input.now,
        },
      },
    );

    return result.matchedCount === 1;
  }

  async recordInvalidResetCodeAttempt(
    input: RecordInvalidResetCodeAttemptInput,
  ): Promise<void> {
    const nextFailures = {
      $add: [{ $ifNull: ['$resetCodeFailures', 0] }, 1],
    };

    await this.model.findOneAndUpdate(
      {
        id: input.id,
        resetCodeHash: input.resetCodeHash,
        resetCodeUsedAt: null,
        resetCodeClaimId: null,
        resetRequestReservationId: null,
      },
      [
        {
          $set: {
            resetCodeFailures: nextFailures,
            resetCodeUsedAt: {
              $cond: [{ $gte: [nextFailures, input.limit] }, input.now, null],
            },
            updatedAt: input.now,
          },
        },
      ],
    );
  }

  async claimResetCode(input: ClaimResetCodeInput): Promise<boolean> {
    const claim = await this.model.findOneAndUpdate(
      {
        id: input.id,
        resetCodeHash: input.resetCodeHash,
        resetCodeExpiresAt: { $gt: input.now },
        resetCodeUsedAt: null,
        resetCodeClaimId: null,
        resetRequestReservationId: null,
        $or: [
          { resetCodeFailures: { $lt: input.failureLimit } },
          { resetCodeFailures: { $exists: false } },
        ],
      },
      {
        $set: {
          resetCodeClaimId: input.claimId,
          resetCodeClaimedAt: input.now,
          updatedAt: input.now,
        },
      },
      { new: true },
    );

    return claim !== null;
  }

  async finalizeResetCodeClaim(
    id: string,
    claimId: string,
    now: Date,
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { id, resetCodeClaimId: claimId, resetCodeUsedAt: null },
      {
        $set: {
          resetCodeHash: null,
          resetCodeExpiresAt: null,
          resetCodeUsedAt: now,
          resetCodeFailures: 0,
          resetCodeClaimId: null,
          resetCodeClaimedAt: null,
          updatedAt: now,
        },
      },
    );

    return result.matchedCount === 1;
  }

  async releaseResetCodeClaim(id: string, claimId: string): Promise<void> {
    await this.model.updateOne(
      { id, resetCodeClaimId: claimId, resetCodeUsedAt: null },
      {
        $set: {
          resetCodeClaimId: null,
          resetCodeClaimedAt: null,
          updatedAt: new Date(),
        },
      },
    );
  }
}

export async function AuthSecurityRepositoryFactory(
  connection: Connection,
): Promise<AuthSecurityRepository> {
  return new MongooseAuthSecurityRepository(
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
      resetCodeFailures: Number,
      resetCodeClaimId: String,
      resetCodeClaimedAt: Date,
      resetRequestReservationId: String,
      lastResetSentAt: Date,
      createdAt: Date,
      updatedAt: Date,
    },
    [[{ email: 1 }, { unique: true }], [{ blockedUntil: 1 }]],
  );
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}
