import { Connection } from 'mongoose';
import { MongooseRepository } from 'src/libs/moongose-repository';
import { Repository } from 'src/libs/repository';

export interface SessionRecord {
  accountId: string;
  jti: string;
  organizationId?: string | null;
  dateTimeCreated: Date;
  dateTimeLastRefreshed: Date;
}

export type SessionsRepository = Repository<SessionRecord>;

export async function SessionsRepositoryFactory(
  connection: Connection,
): Promise<SessionsRepository> {
  return new MongooseRepository<SessionRecord>(
    connection,
    'Sessions',
    {
      accountId: String,
      jti: String,
      organizationId: String,
      dateTimeCreated: Date,
      dateTimeLastRefreshed: Date,
    },
    [
      [{ jti: 1 }, { unique: true }],
      [{ accountId: 1, dateTimeCreated: -1 }],
      [{ accountId: 1, dateTimeLastRefreshed: -1 }],
      [{ organizationId: 1 }],
    ],
  );
}
