import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AppLoggerService } from './common/logger/app-logger.service';
import {
  createCorsOptions,
  createSecurityConfig,
  createSecurityHeadersMiddleware,
} from './config/security-config';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
    });
    app.useLogger(app.get(AppLoggerService));

    const configService = app.get(ConfigService);
    const securityConfig = createSecurityConfig(configService);
    const expressApp = app.getHttpAdapter().getInstance();

    expressApp.disable('x-powered-by');

    if (securityConfig.trustProxy) {
      app.set('trust proxy', true);
    }
    app.use(createSecurityHeadersMiddleware(securityConfig));
    app.enableCors(createCorsOptions(securityConfig));

    const port = configService.get<number>('PORT') ?? 3001;
    await app.listen(port);

    console.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown startup error.';

    console.error(`Application failed to start: ${message}`);
    process.exit(1);
  }
}
void bootstrap();
