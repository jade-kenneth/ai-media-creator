import { Connection, Types } from 'mongoose';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import { Repository } from 'src/libs/repository';

export interface SchedulerLockRecord {
  id: string;
  name: string;
  owner: string;
  acquiredAt: Date;
  expiresAt: Date;
}

export type SchedulerLocksRepository = Repository<SchedulerLockRecord>;

export async function SchedulerLocksRepositoryFactory(
  connection: Connection,
): Promise<SchedulerLocksRepository> {
  return new MongooseRepository<SchedulerLockRecord>(
    connection,
    'SchedulerLocks',
    {
      id: Types.ObjectId,
      name: String,
      owner: String,
      acquiredAt: Date,
      expiresAt: Date,
    },
    [
      [{ name: 1 }, { unique: true }],
      [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
    ],
  );
}
