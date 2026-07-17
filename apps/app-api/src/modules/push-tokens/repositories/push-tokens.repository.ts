import { Connection, Types } from 'mongoose';
import type { PushPlatform } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import type { Repository } from 'src/libs/repository';

export interface PushDeviceMetadataRecord {
  appOwnership?: string | null;
  appVersion?: string | null;
  buildVersion?: string | null;
  deviceName?: string | null;
  locale?: string | null;
  osName?: string | null;
  osVersion?: string | null;
}

export interface PushTokenRecord {
  id: string;
  userId: string;
  token: string;
  platform: PushPlatform;
  deviceMetadata?: PushDeviceMetadataRecord | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PushTokensRepository = Repository<PushTokenRecord>;

const pushDeviceMetadataSchemaDefinition = {
  appOwnership: String,
  appVersion: String,
  buildVersion: String,
  deviceName: String,
  locale: String,
  osName: String,
  osVersion: String,
};

export async function PushTokensRepositoryFactory(
  connection: Connection,
): Promise<PushTokensRepository> {
  return new MongooseRepository<PushTokenRecord>(
    connection,
    'PushTokens',
    {
      id: Types.ObjectId,
      userId: String,
      token: String,
      platform: String,
      deviceMetadata: pushDeviceMetadataSchemaDefinition,
      organizationId: String,
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ token: 1, platform: 1 }, { unique: true }],
      [{ userId: 1, updatedAt: -1 }],
      [{ userId: 1, platform: 1 }],
      [{ organizationId: 1 }],
    ],
  );
}
