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
  /**
   * Owning tenant, captured from request context when the purchase is first
   * verified. Store webhooks carry no tenant, so reconciliation reads it from
   * the record rather than re-deriving it.
   */
  organizationId?: string | null;
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
      organizationId: String,
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ store: 1, storeReference: 1 }, { unique: true }],
      [{ webhookEventIds: 1 }, { sparse: true }],
      [{ organizationId: 1, userId: 1, createdAt: -1 }],
    ],
  );
}
