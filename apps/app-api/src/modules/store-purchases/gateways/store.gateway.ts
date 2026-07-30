import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'src/common/errors/app.error';
import { StorePlatform } from '../../../graphql/generated/graphql';
import type {
  StorePurchaseReference,
  VerifiedPurchase,
} from '../store-purchases.types';

/**
 * Contract every mobile store adapter implements. Purchase verification,
 * acknowledgement, and the store's feature flag are the only surface the
 * purchases service depends on; webhook envelopes, identity checks, and
 * vendor SDK wiring stay on the concrete gateway.
 */
export abstract class StoreGateway {
  protected abstract readonly enabledFlag: string;
  protected abstract readonly platform: StorePlatform;

  constructor(protected readonly configService: ConfigService) {}

  assertEnabled(): void {
    if (!this.configService.get<boolean>(this.enabledFlag)) {
      throw new ValidationError(
        `${this.platform} purchases are not configured.`,
      );
    }
  }

  abstract verifyPurchase(
    reference: StorePurchaseReference,
  ): Promise<VerifiedPurchase>;

  abstract acknowledgePurchase(
    reference: StorePurchaseReference,
  ): Promise<void>;

  protected requiredConfig(name: string): string {
    const value = this.configService.get<string>(name)?.trim();
    if (!value) throw new Error(`${name} is not configured.`);
    return value;
  }
}
