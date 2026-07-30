import {
  type DynamicModule,
  type InjectionToken,
  Module,
  type ModuleMetadata,
} from '@nestjs/common';
import { TOKENS } from 'src/types/tokens';
import { AppleStoreGateway } from './gateways/apple-store.gateway';
import { GoogleStoreGateway } from './gateways/google-store.gateway';
import type { StoreEntitlements } from './ports/store-entitlements';
import type { StoreProductCatalog } from './ports/store-product-catalog';
import { StorePurchasesRepositoryModule } from './repositories/store-purchases.repository.module';
import { StorePurchasesController } from './store-purchases.controller';
import { StorePurchasesResolver } from './store-purchases.resolver';
import { StorePurchasesService } from './store-purchases.service';

export type StorePurchasesModuleOptions = {
  catalog: InjectionToken<StoreProductCatalog>;
  entitlements: InjectionToken<StoreEntitlements>;
  imports?: ModuleMetadata['imports'];
};

@Module({})
export class StorePurchasesModule {
  static forRoot(options: StorePurchasesModuleOptions): DynamicModule {
    return {
      module: StorePurchasesModule,
      imports: [StorePurchasesRepositoryModule, ...(options.imports ?? [])],
      controllers: [StorePurchasesController],
      providers: [
        StorePurchasesResolver,
        StorePurchasesService,
        AppleStoreGateway,
        GoogleStoreGateway,
        {
          provide: TOKENS.STORE_PRODUCT_CATALOG,
          useExisting: options.catalog,
        },
        {
          provide: TOKENS.STORE_ENTITLEMENTS,
          useExisting: options.entitlements,
        },
      ],
    };
  }
}
