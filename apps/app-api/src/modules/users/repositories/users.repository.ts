import { Connection, Types } from 'mongoose';
import { UserRole, type User } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import { Repository } from 'src/libs/repository';

export interface UserRecord extends Omit<
  User,
  'organizationId' | 'firstName' | 'lastName' | 'position'
> {
  passwordHash: string;
  organizationId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
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
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ email: 1 }, { unique: true }],
      [{ organizationId: 1, role: 1, isActive: 1 }],
    ],
  );
}
