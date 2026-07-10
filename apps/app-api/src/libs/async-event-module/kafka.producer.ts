import { Inject, Injectable } from '@nestjs/common';
import type { Kafka, Producer } from 'kafkajs';
import { AsyncEventTokens } from './tokens';
import type { AsyncEvent, AsyncEventModuleOptions } from './types';

@Injectable()
export class KafkaEventProducer {
  private producer!: Producer;

  constructor(
    @Inject(AsyncEventTokens.Kafka) private readonly kafka: Kafka,
    @Inject(AsyncEventTokens.Options)
    private readonly options: AsyncEventModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    this.producer = this.kafka.producer();
    await this.producer.connect();
  }

  async emit(event: AsyncEvent): Promise<void> {
    await this.producer.send({
      topic: `async-event-${this.options.context}`,
      messages: [
        {
          key: event.id,
          value: JSON.stringify(event),
          headers: { type: Buffer.from(event.type) },
        },
      ],
    });
  }
}
