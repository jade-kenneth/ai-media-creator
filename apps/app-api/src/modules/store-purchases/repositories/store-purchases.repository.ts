import { Connection, Types } from 'mongoose';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import { Repository } from 'src/libs/repository';
import { StorePlatform } from '../../../graphql/generated/graphql';

export type StorePurchaseRecord = {
  id: string;
  userId: string;
  store: StorePlatform;
  productId: string;
  storeReference: string;
  latestTransactionId: string;
  active: boolean;
  expiresAt: Date | null;
  webhookEventIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type StorePurchasesRepository = Repository<StorePurchaseRecord>;

export async function StorePurchasesRepositoryFactory(
  connection: Connection,
): Promise<StorePurchasesRepository> {
  return new MongooseRepository<StorePurchaseRecord>(
    connection,
    'StorePurchases',
    {
      id: Types.ObjectId,
      userId: String,
      store: String,
      productId: String,
      storeReference: String,
      latestTransactionId: String,
      active: Boolean,
      expiresAt: Date,
      webhookEventIds: [String],
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ store: 1, storeReference: 1 }, { unique: true }],
      [{ webhookEventIds: 1 }, { sparse: true }],
    ],
  );
}
