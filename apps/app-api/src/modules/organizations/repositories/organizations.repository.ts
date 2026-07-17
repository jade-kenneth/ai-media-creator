import { Connection, Types } from 'mongoose';
import { type Organization } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import { Repository } from 'src/libs/repository';

export type OrganizationRecord = Organization;

export type OrganizationsRepository = Repository<OrganizationRecord>;

export async function OrganizationsRepositoryFactory(
  connection: Connection,
): Promise<OrganizationsRepository> {
  return new MongooseRepository<OrganizationRecord>(
    connection,
    'Organizations',
    {
      id: Types.ObjectId,
      name: String,
      slug: String,
      logoUrl: String,
      primaryColor: String,
      contactNumber: String,
      address: String,
      features: [String],
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date,
    },
    [[{ slug: 1 }, { unique: true }], [{ isActive: 1 }]],
  );
}
