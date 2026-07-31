import { Connection, Types } from 'mongoose';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import { Repository } from 'src/libs/repository';
import {
  PaymentChannel,
  PaymentStatus,
} from '../../../graphql/generated/graphql';

export type PaymentRecord = {
  id: string;
  userId: string;
  referenceId: string;
  gatewayReference: string | null;
  channel: PaymentChannel;
  status: PaymentStatus;
  /** Smallest currency unit, for example centavos for PHP. */
  amount: number;
  currency: string;
  description: string | null;
  redirectUrl: string | null;
  /** Callback ids already applied, so a redelivered webhook is a no-op. */
  webhookEventIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentsRepository = Repository<PaymentRecord>;

export async function PaymentsRepositoryFactory(
  connection: Connection,
): Promise<PaymentsRepository> {
  return new MongooseRepository<PaymentRecord>(
    connection,
    'Payments',
    {
      id: Types.ObjectId,
      userId: String,
      referenceId: String,
      gatewayReference: String,
      channel: {
        type: String,
        enum: Object.values(PaymentChannel),
      },
      status: {
        type: String,
        enum: Object.values(PaymentStatus),
      },
      amount: Number,
      currency: String,
      description: String,
      redirectUrl: String,
      webhookEventIds: [String],
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ id: 1 }, { unique: true }],
      [{ referenceId: 1 }, { unique: true }],
      [{ gatewayReference: 1 }],
      [{ userId: 1, createdAt: -1 }],
    ],
  );
}
