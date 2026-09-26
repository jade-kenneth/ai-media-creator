import { Connection, type FilterQuery } from 'mongoose';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository, RepositoryFilter } from 'src/libs/repository';

/** One balance per creator. `held` is reserved by paid jobs still running. */
export interface CreditAccountRecord {
  id: string;
  ownerId: string;
  organizationId: string | null;
  balance: number;
  held: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditChange {
  balance: number;
  held: number;
}

export interface CreditsRepository extends Repository<CreditAccountRecord> {
  /**
   * Atomically adds `change` to the account matched by `filter`. With
   * `minimumBalance`, applies only while the balance still covers it, which is
   * what makes a hold race-free. Returns whether an account was changed.
   */
  adjust(
    filter: RepositoryFilter<CreditAccountRecord>,
    change: CreditChange,
    minimumBalance?: number,
  ): Promise<boolean>;
}

class MongooseCreditsRepository
  extends MongooseRepository<CreditAccountRecord>
  implements CreditsRepository
{
  async adjust(
    filter: RepositoryFilter<CreditAccountRecord>,
    change: CreditChange,
    minimumBalance?: number,
  ): Promise<boolean> {
    const query: FilterQuery<CreditAccountRecord> = {
      ownerId: filter.ownerId,
      ...(filter.organizationId !== undefined
        ? { organizationId: filter.organizationId }
        : {}),
      ...(minimumBalance !== undefined
        ? { balance: { $gte: minimumBalance } }
        : {}),
    };
    const result = await this.model.updateOne(query, {
      $inc: { balance: change.balance, held: change.held },
      $set: { updatedAt: new Date() },
    });

    return result.matchedCount === 1;
  }
}

export async function CreditsRepositoryFactory(
  connection: Connection,
): Promise<CreditsRepository> {
  return new MongooseCreditsRepository(
    connection,
    'CreditAccounts',
    {
      id: { type: String, required: true },
      ownerId: { type: String, required: true },
      organizationId: { type: String, default: null },
      balance: { type: Number, required: true, min: 0 },
      held: { type: Number, required: true, min: 0 },
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ ownerId: 1 }, { unique: true }],
      [{ organizationId: 1, ownerId: 1 }],
    ],
  );
}
