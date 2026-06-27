import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import {
  REQUEST_ID_HEADER,
  createObservabilityConfig,
  createRequestLogMessage,
  normalizeRequestPath,
  resolveRequestId,
  resolveRequestLogLevel,
  shouldLogRequest,
} from '../../config/observability-config';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly observabilityConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.observabilityConfig = createObservabilityConfig(this.configService);
  }

  use(request: Request, response: Response, next: NextFunction) {
    if (!this.observabilityConfig.requestLogging.enabled) {
      next();

      return;
    }

    const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER]);
    const startedAt = process.hrtime.bigint();
    const path = normalizeRequestPath(request.originalUrl ?? request.url);

    response.setHeader(REQUEST_ID_HEADER, requestId);

    response.once('finish', () => {
      if (
        !shouldLogRequest(
          request.method,
          path,
          this.observabilityConfig,
        )
      ) {
        return;
      }

      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const message = createRequestLogMessage(
        request,
        response,
        requestId,
        durationMs,
        path,
      );
      const logLevel = resolveRequestLogLevel(
        response.statusCode,
        durationMs,
        this.observabilityConfig.requestLogging.slowRequestWarnThresholdMs,
      );

      if (logLevel === 'error') {
        this.logger.error(message, undefined, 'RequestLogger');

        return;
      }

      if (logLevel === 'warn') {
        this.logger.warn(message, 'RequestLogger');

        return;
      }

      this.logger.log(message, 'RequestLogger');
    });

    next();
  }
}
