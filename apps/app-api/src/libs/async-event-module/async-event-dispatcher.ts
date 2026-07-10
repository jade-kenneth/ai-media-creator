import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { KafkaEventProducer } from './kafka.producer';
import type { AsyncEvent, AsyncEventType } from './types';

@Injectable()
export class AsyncEventDispatcher {
  constructor(private readonly producer: KafkaEventProducer) {}

  async dispatch<TData, TType extends AsyncEventType = string>(
    type: TType,
    data: TData,
    options?: { id?: string },
  ): Promise<void> {
    const event: AsyncEvent<TData, TType> = {
      type,
      data,
      id: options?.id ?? randomUUID(),
    };

    await this.producer.emit(event);
  }
}
