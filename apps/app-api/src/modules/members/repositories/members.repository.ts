import { Connection, Types } from 'mongoose';
import type { MemberProfile } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/moongose-repository';
import { Repository } from 'src/libs/repository';

export interface MemberProfileRecord extends Omit<
  MemberProfile,
  'fullName' | 'user'
> {
  fullName?: string;
  user?: null;
  organizationId?: string | null;
}

export type MembersRepository = Repository<MemberProfileRecord>;

export async function MembersRepositoryFactory(
  connection: Connection,
): Promise<MembersRepository> {
  return new MongooseRepository<MemberProfileRecord>(
    connection,
    'MemberProfiles',
    {
      id: Types.ObjectId,
      userId: String,
      firstName: String,
      lastName: String,
      middleName: String,
      birthdate: Date,
      gender: String,
      address: String,
      purok: String,
      contactNumber: String,
      organizationId: String,
      createdAt: Date,
      updatedAt: Date,
    },
    [[{ userId: 1 }, { unique: true }], [{ organizationId: 1 }]],
  );
}
