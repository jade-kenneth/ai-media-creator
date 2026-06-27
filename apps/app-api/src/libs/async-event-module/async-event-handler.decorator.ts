import { SetMetadata } from '@nestjs/common';
import { AsyncEventType } from './types';

export const ASYNC_EVENT_HANDLER = 'ASYNC_EVENT_HANDLER';

export const AsyncEventHandler = (
  event: AsyncEventType,
  options?: { dedupeTtl?: number },
): MethodDecorator => SetMetadata(ASYNC_EVENT_HANDLER, { event, options });
