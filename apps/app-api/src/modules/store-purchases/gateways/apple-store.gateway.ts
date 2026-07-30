import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Environment,
  type JWSTransactionDecodedPayload,
  SignedDataVerifier,
} from '@apple/app-store-server-library';
import { ValidationError } from 'src/common/errors/app.error';
import { StorePlatform } from '../../../graphql/generated/graphql';
import type {
  StorePurchaseReference,
  VerifiedPurchase,
} from '../store-purchases.types';
import { StoreGateway } from './store.gateway';

@Injectable()
export class AppleStoreGateway extends StoreGateway {
  protected readonly enabledFlag = 'APPLE_IAP_ENABLED';
  protected readonly platform = StorePlatform.APPLE;

  constructor(configService: ConfigService) {
    super(configService);
  }

  async verifyPurchase({
    purchaseToken,
  }: StorePurchaseReference): Promise<VerifiedPurchase> {
    try {
      const decoded =
        await this.verifier().verifyAndDecodeTransaction(purchaseToken);
      if (
        !decoded.productId ||
        !decoded.transactionId ||
        !decoded.originalTransactionId
      ) {
        throw new Error('Missing transaction fields.');
      }
      return this.toVerifiedPurchase(decoded);
    } catch {
      throw new ValidationError('Apple could not verify this purchase.');
    }
  }

  /**
   * StoreKit finishes Apple transactions on the device, so a verified Apple
   * purchase is always reported as acknowledged and the server has nothing
   * left to confirm.
   */
  acknowledgePurchase(): Promise<void> {
    return Promise.resolve();
  }

  async decodeNotificationEnvelope(
    signedPayload: string,
  ): Promise<{ eventId: string; signedTransactionInfo: string } | null> {
    const notification =
      await this.verifier().verifyAndDecodeNotification(signedPayload);
    const eventId = notification.notificationUUID;
    const signedTransactionInfo = notification.data?.signedTransactionInfo;
    if (!eventId || !signedTransactionInfo) return null;
    return { eventId, signedTransactionInfo };
  }

  async verifyNotificationTransaction(
    signedTransactionInfo: string,
  ): Promise<VerifiedPurchase> {
    const decoded = await this.verifier().verifyAndDecodeTransaction(
      signedTransactionInfo,
    );
    if (
      !decoded.productId ||
      !decoded.transactionId ||
      !decoded.originalTransactionId
    ) {
      throw new BadRequestException(
        'Apple notification transaction is incomplete.',
      );
    }
    return this.toVerifiedPurchase(decoded);
  }

  private toVerifiedPurchase(
    decoded: JWSTransactionDecodedPayload,
  ): VerifiedPurchase {
    return {
      acknowledged: true,
      active:
        !decoded.revocationDate &&
        (!decoded.expiresDate || decoded.expiresDate > Date.now()),
      expiresAt: decoded.expiresDate ? new Date(decoded.expiresDate) : null,
      productId: decoded.productId!,
      storeReference: decoded.originalTransactionId!,
      transactionId: decoded.transactionId!,
    };
  }

  private verifier(): SignedDataVerifier {
    const environment =
      this.requiredConfig('APPLE_IAP_ENVIRONMENT') === 'PRODUCTION'
        ? Environment.PRODUCTION
        : Environment.SANDBOX;
    const roots = this.requiredConfig('APPLE_IAP_ROOT_CA_BASE64')
      .split(',')
      .map((certificate) => Buffer.from(certificate.trim(), 'base64'));
    const appId = this.configService.get<number>('APPLE_IAP_APP_ID');
    return new SignedDataVerifier(
      roots,
      true,
      environment,
      this.requiredConfig('APPLE_IAP_BUNDLE_ID'),
      environment === Environment.PRODUCTION ? appId : undefined,
    );
  }
}
