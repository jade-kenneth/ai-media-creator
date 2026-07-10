import { DynamicModule, Module } from '@nestjs/common';
import type { FactoryProvider } from '@nestjs/common';
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
import type { AsyncEventModuleOptions } from './types';

@Module({
  imports: [DiscoveryModule],
})
export class AsyncEventModule {
  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => AsyncEventModuleOptions | Promise<AsyncEventModuleOptions>;
    inject?: FactoryProvider['inject'];
  }): DynamicModule {
    return {
      module: AsyncEventModule,
      global: true,
      providers: [
        {
          provide: AsyncEventTokens.Options,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: AsyncEventTokens.Kafka,
          useFactory: (config: AsyncEventModuleOptions) =>
            new Kafka({
              brokers: config.kafka.brokers,
              clientId: config.kafka.clientId ?? config.context,
              connectionTimeout: 3000,
              requestTimeout: 30000,
              retry: {
                initialRetryTime: 300,
                retries: 10,
              },
              ...(config.kafka.ssl
                ? {
                    ssl: true,
                    ...(config.kafka.username && config.kafka.password
                      ? {
                          sasl: {
                            mechanism: 'scram-sha-256' as const,
                            username: config.kafka.username,
                            password: config.kafka.password,
                          },
                        }
                      : {}),
                  }
                : {}),
            }),
          inject: [AsyncEventTokens.Options],
        },
        {
          provide: AsyncEventTokens.KafkaConsumer,
          useFactory: async (
            kafka: Kafka,
            config: AsyncEventModuleOptions,
          ) => {
            const topic = `async-event-${config.context}`;
            const admin = kafka.admin();

            await admin.connect();
            const existingTopics = await admin.listTopics();

            if (!existingTopics.includes(topic)) {
              await admin.createTopics({
                topics: [{ topic, numPartitions: 1, replicationFactor: 1 }],
              });
            }

            await admin.disconnect();

            const consumer = kafka.consumer({
              groupId: `async-event-${config.context}`,
            });

            await consumer.connect();
            await consumer.subscribe({ topic, fromBeginning: false });

            return consumer;
          },
          inject: [AsyncEventTokens.Kafka, AsyncEventTokens.Options],
        },
        {
          provide: AsyncEventTokens.Handlers,
          useFactory: () => new Map(),
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
