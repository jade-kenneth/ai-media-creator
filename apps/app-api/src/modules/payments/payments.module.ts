import { Module } from '@nestjs/common';
import { XenditGateway } from './gateways/xendit.gateway';
import { PaymentsController } from './payments.controller';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsService } from './payments.service';
import { PaymentsRepositoryModule } from './repositories/payments.repository.module';

@Module({
  imports: [PaymentsRepositoryModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsResolver, XenditGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
