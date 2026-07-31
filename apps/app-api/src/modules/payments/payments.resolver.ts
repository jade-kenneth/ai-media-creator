import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type {
  CreatePaymentInput,
  Payment,
} from '../../graphql/generated/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { PaymentsService } from './payments.service';

@Resolver('Payment')
@UseGuards(GraphqlAuthGuard)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Mutation('createPayment')
  async createPayment(
    @ServiceValidatedArgs('input') input: CreatePaymentInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Payment> {
    return this.paymentsService.createPayment(user, input);
  }

  @Query('payment')
  async payment(
    @Args('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Payment> {
    return this.paymentsService.findByIdForUser(user, id);
  }

  @Query('myPayments')
  async myPayments(@CurrentUser() user: AuthenticatedUser): Promise<Payment[]> {
    return this.paymentsService.listForUser(user);
  }
}
