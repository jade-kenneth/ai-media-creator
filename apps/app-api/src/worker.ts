import { NestFactory } from '@nestjs/core';
import { AppLoggerService } from './common/logger/app-logger.service';
import { MediaWorkerModule } from './media-worker.module';

/**
 * Entry point for the media worker: a separate process that claims voice and
 * render jobs from the shared job collection. It opens no port.
 */
async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(MediaWorkerModule, {
      bufferLogs: true,
    });
    app.useLogger(app.get(AppLoggerService));
    app.enableShutdownHooks();

    console.log('Media worker is running.');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown startup error.';

    console.error(`Media worker failed to start: ${message}`);
    process.exit(1);
  }
}
void bootstrap();
