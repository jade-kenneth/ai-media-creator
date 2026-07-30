import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/validation/zod-validation.pipe';
import { Public } from '../auth/decorators/public.decorator';
import { StorePurchasesService } from './store-purchases.service';
import {
  appleNotificationBodySchema,
  type AppleNotificationBody,
  googleNotificationBodySchema,
  type GoogleNotificationBody,
} from './store-purchases.validation';

@Controller('store-webhooks')
@Public()
export class StorePurchasesController {
  constructor(private readonly storePurchases: StorePurchasesService) {}

  @Post('apple')
  @HttpCode(200)
  async apple(
    @Body(new ZodValidationPipe(appleNotificationBodySchema))
    body: AppleNotificationBody,
  ): Promise<{ received: true }> {
    await this.storePurchases.receiveAppleNotification(body);
    return { received: true };
  }

  @Post('google')
  @HttpCode(204)
  async google(
    @Body(new ZodValidationPipe(googleNotificationBodySchema))
    body: GoogleNotificationBody,
    @Headers('authorization') authorization?: string,
  ): Promise<void> {
    await this.storePurchases.receiveGoogleNotification(body, authorization);
  }
}
