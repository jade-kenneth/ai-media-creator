import { Connection, Types } from 'mongoose';
import { MongooseRepository } from 'src/libs/moongose-repository';
import type {
  Repository,
  Connection as RepositoryConnection,
  RepositoryFilter,
  RepositorySort,
} from 'src/libs/repository';
import {
  WaitlistRole,
  type WaitlistEntry,
} from '../../../graphql/generated/graphql';
import {
  WAITLIST_COLLECTION_NAME,
  WAITLIST_SCHEMA_DEFINITION,
  WAITLIST_SCHEMA_INDEXES,
} from './waitlist.schema';

export interface WaitlistEntryRecord extends Omit<
  WaitlistEntry,
  '__typename'
> {}

export interface WaitlistRoleCountRecord {
  role: WaitlistRole;
  count: number;
}

export type WaitlistEntryDraft = Omit<WaitlistEntryRecord, 'id' | 'createdAt'>;

export interface WaitlistRepository {
  create(draft: WaitlistEntryDraft): Promise<WaitlistEntryRecord>;
  findAll(
    filter?: RepositoryFilter<WaitlistEntryRecord>,
    sort?: RepositorySort<WaitlistEntryRecord>,
    first?: number,
    after?: string,
  ): Promise<RepositoryConnection<WaitlistEntryRecord>>;
  countByRole(): Promise<WaitlistRoleCountRecord[]>;
  existsByEmail(email: string): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;
}

const WAITLIST_SORT = {
  createdAt: 'DESC',
} as const;

export async function WaitlistRepositoryFactory(
  connection: Connection,
): Promise<WaitlistRepository> {
  const repository = new MongooseRepository<WaitlistEntryRecord>(
    connection,
    WAITLIST_COLLECTION_NAME,
    WAITLIST_SCHEMA_DEFINITION,
    WAITLIST_SCHEMA_INDEXES,
  ) as Repository<WaitlistEntryRecord>;

  return {
    async create(draft: WaitlistEntryDraft) {
      return repository.create({
        id: new Types.ObjectId().toHexString(),
        ...draft,
        createdAt: new Date(),
      });
    },

    async findAll(filter, sort, first, after) {
      return repository
        .list(filter, {
          sort: sort ?? WAITLIST_SORT,
        })
        .connection({ first, after });
    },

    async countByRole() {
      const roles = Object.values(WaitlistRole);
      const counts = await Promise.all(
        roles.map((role) => repository.count({ role })),
      );

      return roles.map((role, index) => ({
        role,
        count: counts[index] ?? 0,
      }));
    },

    async existsByEmail(email: string) {
      return repository.exists({ email });
    },

    async deleteById(id: string) {
      const exists = await repository.exists({ id });

      if (!exists) {
        return false;
      }

      await repository.delete({ id });

      return true;
    },
  };
}
