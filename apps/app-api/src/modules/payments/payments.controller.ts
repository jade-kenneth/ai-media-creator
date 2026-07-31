import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/validation/zod-validation.pipe';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import {
  xenditCallbackBodySchema,
  type XenditCallbackBody,
} from './payments.validation';

@Controller('payment-webhooks')
@Public()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('xendit')
  @HttpCode(HttpStatus.OK)
  async xendit(
    @Body(new ZodValidationPipe(xenditCallbackBodySchema))
    body: XenditCallbackBody,
    @Headers('x-callback-token') callbackToken?: string,
  ): Promise<{ received: true }> {
    if (!this.paymentsService.verifyCallbackToken(callbackToken)) {
      throw new UnauthorizedException('Invalid callback token.');
    }

    await this.paymentsService.receiveXenditCallback(body);

    return { received: true };
  }
}
