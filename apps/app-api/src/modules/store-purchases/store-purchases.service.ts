import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ValidationError } from 'src/common/errors/app.error';
import { TOKENS } from 'src/types/tokens';
import {
  StorePlatform,
  type StorePurchaseResult,
  type VerifyStorePurchaseInput,
} from '../../graphql/generated/graphql';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { AppleStoreGateway } from './gateways/apple-store.gateway';
import { GoogleStoreGateway } from './gateways/google-store.gateway';
import type { StoreGateway } from './gateways/store.gateway';
import type {
  StorePurchaseRecord,
  StorePurchasesRepository,
} from './repositories/store-purchases.repository';
import type { StoreEntitlements } from './ports/store-entitlements';
import type { StoreProductCatalog } from './ports/store-product-catalog';
import type { VerifiedPurchase } from './store-purchases.types';
import type {
  AppleNotificationBody,
  GoogleNotificationBody,
} from './store-purchases.validation';

@Injectable()
export class StorePurchasesService {
  constructor(
    @Inject(TOKENS.STORE_PURCHASES_REPOSITORY)
    private readonly purchasesRepository: StorePurchasesRepository,
    @Inject(TOKENS.STORE_PRODUCT_CATALOG)
    private readonly catalog: StoreProductCatalog,
    @Inject(TOKENS.STORE_ENTITLEMENTS)
    private readonly entitlements: StoreEntitlements,
    private readonly appleGateway: AppleStoreGateway,
    private readonly googleGateway: GoogleStoreGateway,
  ) {}

  async verifyPurchase(
    input: VerifyStorePurchaseInput,
    user: AuthenticatedUser,
    organizationId?: string | null,
  ): Promise<StorePurchaseResult> {
    const gateway = this.gateway(input.store);
    gateway.assertEnabled();

    const product = this.product(input.productId);
    const reference = {
      product,
      productId: input.productId,
      purchaseToken: input.purchaseToken,
    };
    const verified = await gateway.verifyPurchase(reference);
    this.assertMatchesRequest(input, verified);

    await this.savePurchase(input.store, user.id, verified, organizationId);
    const extension = await this.entitlements.grant(
      user.id,
      input.productId,
      verified,
    );
    if (!verified.acknowledged) {
      await gateway.acknowledgePurchase(reference);
    }

    return {
      ...extension,
      productId: verified.productId,
      status: 'VERIFIED',
    };
  }

  async receiveAppleNotification(body: AppleNotificationBody): Promise<void> {
    this.appleGateway.assertEnabled();
    const envelope = await this.appleGateway.decodeNotificationEnvelope(
      body.signedPayload,
    );
    if (!envelope) return;
    if (await this.alreadyProcessed(envelope.eventId)) return;

    const verified = await this.appleGateway.verifyNotificationTransaction(
      envelope.signedTransactionInfo,
    );
    await this.reconcilePurchase(
      StorePlatform.APPLE,
      verified,
      envelope.eventId,
    );
  }

  async receiveGoogleNotification(
    body: GoogleNotificationBody,
    authorization?: string,
  ): Promise<void> {
    this.googleGateway.assertEnabled();
    await this.googleGateway.verifyPubSubIdentity(authorization);
    if (await this.alreadyProcessed(body.message.messageId)) return;

    const decoded = this.googleGateway.decodeNotification(body);
    if (!decoded) return;
    const verified = await this.googleGateway.verifyPurchase({
      ...decoded,
      product: this.product(decoded.productId),
    });
    await this.reconcilePurchase(
      StorePlatform.GOOGLE,
      verified,
      body.message.messageId,
    );
  }

  private assertMatchesRequest(
    input: VerifyStorePurchaseInput,
    verified: VerifiedPurchase,
  ): void {
    if (verified.productId !== input.productId) {
      throw new ValidationError(
        'The store receipt does not match this product.',
      );
    }
    if (
      input.transactionId?.trim() &&
      input.transactionId !== verified.transactionId
    ) {
      throw new ValidationError(
        'The store transaction identifier does not match.',
      );
    }
    if (!verified.active) {
      throw new ValidationError('This store purchase is not active.');
    }
  }

  private async savePurchase(
    store: StorePlatform,
    userId: string,
    verified: VerifiedPurchase,
    organizationId?: string | null,
  ): Promise<void> {
    const existing = await this.findPurchase(store, verified.storeReference);
    if (!existing) {
      const now = new Date();
      await this.purchasesRepository.create({
        id: new Types.ObjectId().toHexString(),
        userId,
        store,
        productId: verified.productId,
        storeReference: verified.storeReference,
        latestTransactionId: verified.transactionId,
        active: verified.active,
        expiresAt: verified.expiresAt,
        webhookEventIds: [],
        organizationId: organizationId ?? null,
        createdAt: now,
        updatedAt: now,
      });
      return;
    }

    if (existing.userId !== userId) {
      throw new ValidationError(
        'This store purchase belongs to another account.',
      );
    }
    await this.purchasesRepository.update(
      { id: existing.id },
      {
        active: verified.active,
        expiresAt: verified.expiresAt,
        latestTransactionId: verified.transactionId,
        productId: verified.productId,
        updatedAt: new Date(),
      },
    );
  }

  private async reconcilePurchase(
    store: StorePlatform,
    verified: VerifiedPurchase,
    eventId: string,
  ): Promise<void> {
    const record = await this.findPurchase(store, verified.storeReference);
    if (!record) return;

    await this.purchasesRepository.update(
      { id: record.id },
      {
        active: verified.active,
        expiresAt: verified.expiresAt,
        latestTransactionId: verified.transactionId,
        productId: verified.productId,
        webhookEventIds: [...record.webhookEventIds, eventId],
        updatedAt: new Date(),
      },
    );
    await this.entitlements.reconcile(
      record.userId,
      record.latestTransactionId,
      verified,
    );
  }

  /**
   * Deliberately unscoped: (store, storeReference) is a store-issued identifier,
   * uniquely indexed across the collection, and the webhook paths that call this
   * carry no session and therefore no tenant. The record's own organizationId is
   * the tenant of record; cross-account claiming is prevented by the userId check
   * in savePurchase rather than by a tenant filter.
   */
  private async findPurchase(
    store: StorePlatform,
    storeReference: string,
  ): Promise<StorePurchaseRecord | undefined> {
    const [record] = await this.purchasesRepository
      .list({ store, storeReference })
      .collect();
    return record;
  }

  private alreadyProcessed(eventId: string): Promise<boolean> {
    return this.purchasesRepository.exists({
      webhookEventIds: { equal: eventId },
    });
  }

  private gateway(store: StorePlatform): StoreGateway {
    return store === StorePlatform.APPLE
      ? this.appleGateway
      : this.googleGateway;
  }

  private product(productId: string): {
    kind: 'SUBSCRIPTION' | 'NON_CONSUMABLE';
  } {
    const product = this.catalog.resolve(productId);
    if (!product) throw new ValidationError('Unknown store product.');
    return product;
  }
}
