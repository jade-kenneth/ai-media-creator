import { DynamicModule, Module } from '@nestjs/common';
import {
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
} from '@nestjs/core';

import { Kafka } from 'kafkajs';
import { AsyncEventDispatcher } from './async-event-dispatcher';
import { KafkaEventConsumer } from './kafka.consumer';
import { KafkaEventProducer } from './kafka.producer';
import { AsyncEventTokens } from './tokens';
import { AsyncEventModuleOptions } from './types';

@Module({
  imports: [DiscoveryModule],
})
export class AsyncEventModule {
  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => AsyncEventModuleOptions | Promise<AsyncEventModuleOptions>;
    inject?: unknown[];
  }): DynamicModule {
    return {
      module: AsyncEventModule,
      global: true,
      providers: [
        {
          provide: AsyncEventTokens.Options,
          useFactory: options.useFactory,
          inject: <never>options.inject || [],
        },

        {
          provide: AsyncEventTokens.Kafka,
          useFactory: (opts: AsyncEventModuleOptions) =>
            new Kafka({
              brokers: opts.kafka.brokers,
              clientId: opts.kafka.clientId ?? opts.context,
              connectionTimeout: 3000,
              requestTimeout: 30000,
              retry: {
                initialRetryTime: 300,
                retries: 10,
              },
              ...(process.env.NEXT_PUBLIC_ENV === 'production' && {
                ssl: {}, // required on redpanda cloud remove when using local dev
                sasl: {
                  // required on redpanda cloud remove when using local dev
                  // remove sasl when using local dev
                  mechanism: 'scram-sha-256',
                  username: process.env.KAFKA_USERNAME ?? 'username',
                  password: process.env.KAFKA_PASSWORD ?? 'password',
                },
              }),
            }),
          inject: [AsyncEventTokens.Options],
        },

        {
          provide: AsyncEventTokens.KafkaConsumer,
          useFactory: async (kafka: Kafka, opts: AsyncEventModuleOptions) => {
            const topic = `async-event-${opts.context}`;

            const admin = kafka.admin();
            await admin.connect();
            const existing = await admin.listTopics();
            if (!existing.includes(topic)) {
              await admin.createTopics({
                topics: [{ topic, numPartitions: 1, replicationFactor: 1 }],
              });
            }
            await admin.disconnect();

            const consumer = kafka.consumer({
              groupId: `async-event-${opts.context}`,
            });
            await consumer.connect();

            await consumer.subscribe({ topic, fromBeginning: false });

            return consumer;
          },
          inject: [AsyncEventTokens.Kafka, AsyncEventTokens.Options],
        },

        {
          provide: AsyncEventTokens.Handlers,
          useFactory: () => new Map<string, any>(),
        },

        DiscoveryService,
        MetadataScanner,
        Reflector,
        AsyncEventDispatcher,
        KafkaEventProducer,
        KafkaEventConsumer,
      ],

      exports: [AsyncEventDispatcher, KafkaEventProducer],
    };
  }
}
