import { Connection, Types } from 'mongoose';
import { UserRole, type User } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import { Repository } from 'src/libs/repository';

export interface UserRecord extends Omit<
  User,
  'organizationId' | 'firstName' | 'lastName' | 'position' | 'googleLinked'
> {
  passwordHash: string;
  organizationId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  /** Google's stable subject identifier, set once an account is linked. */
  googleSub?: string | null;
}

export type UsersRepository = Repository<UserRecord>;

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
      role: {
        type: String,
        enum: Object.values(UserRole),
      },
      isActive: Boolean,
      organizationId: String,
      firstName: String,
      lastName: String,
      position: String,
      googleSub: String,
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ email: 1 }, { unique: true }],
      [{ organizationId: 1, role: 1, isActive: 1 }],
      // Partial rather than sparse: an unlinked account stores an explicit
      // null, and a sparse unique index would treat every one of those nulls
      // as the same value and reject the second unlinked account.
      [
        { googleSub: 1 },
        {
          unique: true,
          partialFilterExpression: { googleSub: { $type: 'string' } },
        },
      ],
    ],
  );
}
