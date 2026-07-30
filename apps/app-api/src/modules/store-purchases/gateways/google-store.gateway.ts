import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { ValidationError } from 'src/common/errors/app.error';
import { StorePlatform } from '../../../graphql/generated/graphql';
import type { GoogleNotificationBody } from '../store-purchases.validation';
import type {
  StorePurchaseReference,
  VerifiedPurchase,
} from '../store-purchases.types';
import { StoreGateway } from './store.gateway';

type GoogleRtdn = {
  packageName?: string;
  subscriptionNotification?: {
    purchaseToken?: string;
    subscriptionId?: string;
  };
  oneTimeProductNotification?: { purchaseToken?: string; sku?: string };
};

@Injectable()
export class GoogleStoreGateway extends StoreGateway {
  protected readonly enabledFlag = 'STORE_IAP_ENABLED';
  protected readonly platform = StorePlatform.GOOGLE;

  constructor(configService: ConfigService) {
    super(configService);
  }

  async verifyPurchase({
    product,
    productId,
    purchaseToken,
  }: StorePurchaseReference): Promise<VerifiedPurchase> {
    try {
      const publisher = this.publisher();
      const packageName = this.requiredConfig('GOOGLE_PLAY_PACKAGE_NAME');
      if (product.kind === 'SUBSCRIPTION') {
        const { data } = await publisher.purchases.subscriptionsv2.get({
          packageName,
          token: purchaseToken,
        });
        const line = data.lineItems?.find(
          (item) => item.productId === productId,
        );
        if (!line) throw new Error('Product mismatch.');
        const activeStates = new Set([
          'SUBSCRIPTION_STATE_ACTIVE',
          'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
          'SUBSCRIPTION_STATE_CANCELED',
        ]);
        const expiresAt = line.expiryTime ? new Date(line.expiryTime) : null;
        return {
          acknowledged:
            data.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
          active:
            activeStates.has(data.subscriptionState ?? '') &&
            (!expiresAt || expiresAt.getTime() > Date.now()),
          expiresAt,
          productId,
          storeReference: purchaseToken,
          transactionId: line.latestSuccessfulOrderId ?? purchaseToken,
        };
      }
      const { data } =
        await publisher.purchases.productsv2.getproductpurchasev2({
          packageName,
          token: purchaseToken,
        });
      if (!data.productLineItem?.some((item) => item.productId === productId)) {
        throw new Error('Product mismatch.');
      }
      return {
        acknowledged:
          data.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        active: data.purchaseStateContext?.purchaseState === 'PURCHASED',
        expiresAt: null,
        productId,
        storeReference: purchaseToken,
        transactionId: data.orderId ?? purchaseToken,
      };
    } catch {
      throw new ValidationError('Google Play could not verify this purchase.');
    }
  }

  async acknowledgePurchase({
    product,
    productId,
    purchaseToken,
  }: StorePurchaseReference): Promise<void> {
    try {
      const publisher = this.publisher();
      const packageName = this.requiredConfig('GOOGLE_PLAY_PACKAGE_NAME');
      if (product.kind === 'SUBSCRIPTION') {
        await publisher.purchases.subscriptions.acknowledge({
          packageName,
          subscriptionId: productId,
          token: purchaseToken,
          requestBody: {},
        });
      } else {
        await publisher.purchases.products.acknowledge({
          packageName,
          productId,
          token: purchaseToken,
          requestBody: {},
        });
      }
    } catch {
      throw new ValidationError(
        'Google Play could not acknowledge this purchase.',
      );
    }
  }

  async verifyPubSubIdentity(authorization?: string): Promise<void> {
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token)
      throw new UnauthorizedException('Google Pub/Sub identity is required.');
    const audience = this.requiredConfig('GOOGLE_PLAY_PUBSUB_AUDIENCE');
    const ticket = await new google.auth.OAuth2().verifyIdToken({
      idToken: token,
      audience,
    });
    const payload = ticket.getPayload();
    if (
      payload?.email_verified !== true ||
      payload.email !==
        this.requiredConfig('GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL')
    ) {
      throw new UnauthorizedException(
        'Google Pub/Sub identity is not allowed.',
      );
    }
  }

  decodeNotification(
    body: GoogleNotificationBody,
  ): { productId: string; purchaseToken: string } | null {
    const decoded = JSON.parse(
      Buffer.from(body.message.data, 'base64').toString('utf8'),
    ) as GoogleRtdn;
    const expectedPackage = this.requiredConfig('GOOGLE_PLAY_PACKAGE_NAME');
    if (decoded.packageName !== expectedPackage) {
      throw new BadRequestException(
        'Google notification package does not match.',
      );
    }
    const purchaseToken =
      decoded.subscriptionNotification?.purchaseToken ??
      decoded.oneTimeProductNotification?.purchaseToken;
    const productId =
      decoded.subscriptionNotification?.subscriptionId ??
      decoded.oneTimeProductNotification?.sku;
    if (!purchaseToken || !productId) return null;
    return { productId, purchaseToken };
  }

  private publisher() {
    return google.androidpublisher({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        credentials: this.credentials(),
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      }),
    });
  }

  private credentials(): Record<string, unknown> {
    try {
      return JSON.parse(
        Buffer.from(
          this.requiredConfig('GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64'),
          'base64',
        ).toString('utf8'),
      ) as Record<string, unknown>;
    } catch {
      throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64 is invalid.');
    }
  }
}
