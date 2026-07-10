import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import type { Consumer } from 'kafkajs';
import { ASYNC_EVENT_HANDLER } from './async-event-handler.decorator';
import { AsyncEventTokens } from './tokens';
import type { AsyncEvent, AsyncEventModuleOptions } from './types';

type DiscoveredHandler = {
  dedupeTtl: number | null;
  fn: (event: AsyncEvent) => Promise<void> | void;
};

@Injectable()
export class KafkaEventConsumer implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
    @Inject(AsyncEventTokens.KafkaConsumer)
    private readonly consumer: Consumer,
    @Inject(AsyncEventTokens.Handlers)
    private readonly handlers: Map<string, DiscoveredHandler>,
    @Inject(AsyncEventTokens.Options)
    private readonly options: AsyncEventModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    this.discoverHandlers();

    await this.consumer.run({
      partitionsConsumedConcurrently: this.options.concurrency ?? 5,
      eachMessage: async ({ message }) => {
        const type = message.headers?.type?.toString();

        if (!type) return;

        const handler = this.handlers.get(type);

        if (!handler) return;

        const rawEvent = message.value?.toString();

        if (!rawEvent) return;

        const event = JSON.parse(rawEvent) as AsyncEvent;
        await handler.fn(event);
      },
    });
  }

  private discoverHandlers(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance as Record<string, unknown> | undefined;

      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance) as object;

      this.scanner.scanFromPrototype(instance, prototype, (methodName) => {
        const method = instance[methodName];

        if (typeof method !== 'function') return;

        const metadata = this.reflector.get<{
          event: string;
          options?: { dedupeTtl?: number };
        }>(ASYNC_EVENT_HANDLER, method);

        if (!metadata) return;

        this.handlers.set(metadata.event, {
          fn: method.bind(instance) as DiscoveredHandler['fn'],
          dedupeTtl: metadata.options?.dedupeTtl ?? null,
        });
      });
    }
  }
}
