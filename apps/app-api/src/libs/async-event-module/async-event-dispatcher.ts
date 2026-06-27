import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { KafkaEventProducer } from './kafka.producer';
import { AsyncEvent, AsyncEventPayloads, AsyncEventType } from './types';

@Injectable()
export class AsyncEventDispatcher {
  constructor(private readonly producer: KafkaEventProducer) {}

  async dispatch<TType extends AsyncEventType>(
    type: TType,
    data: AsyncEventPayloads[TType],
    options?: { id?: string },
  ) {
    console.log(type, 'type');
    const event: AsyncEvent<TType> = {
      type,
      data,
      id: options?.id ?? randomUUID(),
    };

    await this.producer.emit(event);
  }
}
