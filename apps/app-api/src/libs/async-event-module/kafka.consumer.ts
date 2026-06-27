import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

import { type Consumer } from 'kafkajs';
import { ASYNC_EVENT_HANDLER } from './async-event-handler.decorator';
import { AsyncEventTokens } from './tokens';
import { AsyncEvent } from './types';

@Injectable()
export class KafkaEventConsumer implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
    @Inject(AsyncEventTokens.KafkaConsumer)
    private readonly consumer: Consumer,
    @Inject(AsyncEventTokens.Handlers)
    private readonly handlers: Map<string, any>,
  ) {}

  async onModuleInit() {
    await this.discoverHandlers();

    await this.consumer.run({
      partitionsConsumedConcurrently: 5,
      eachMessage: async ({ message }) => {
        //from kafka producer this fires getting
        /** if console log message results to:
         * 
         * 
         *  console.log('[Kafka] Received message:', message.value.toString());
            console.log('[Kafka] Headers:', message.headers);
         * [Kafka] Received message: {"type":"SuccessfulSignup","id":"4417a153-f99b-44db-b84f-3f930e937399","data":{  
            "emailAddress":"jadekennethdarunday@gmail.com","firstName":"jadekennethdarunday"}} 
            
            [Kafka] Headers: { type: <Buffer 53 75 63 63 65 73 73 66 75 6c 53 69 67 6e 75 70> }                         ║
            Handling SuccessfulSignup event: {                                                                          ║
               type: 'SuccessfulSignup',                                                                                 ║
               id: '4417a153-f99b-44db-b84f-3f930e937399',                                                               ║
               data: {                                                                                                   ║
                 emailAddress: 'jadekennethdarunday@gmail.com',                                                          ║
                 firstName: 'jadekennethdarunday'                                                                        ║
               }                                                                                                         ║
             }                                                                                                           ║
         */
        const type = message.headers?.type?.toString() ?? null;
        if (!type) return;

        const handler = this.handlers.get(type);
        if (!handler) return;

        const event: AsyncEvent = JSON.parse(message?.value?.toString() ?? '');

        // Optional deduplication
        // if (handler.dedupeTtl && this.redis) {
        //   const key = `async-event:${type}:${event.id}`;
        //   const exists = await this.redis.set(
        //     key,
        //     '1',
        //     'PX',
        //     handler.dedupeTtl,
        //     'NX',
        //   );
        //   if (exists === null) return; // duplicate detected
        // }

        await handler.fn(event);
      },
    });
  }

  private async discoverHandlers() {
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance);

      this.scanner.scanFromPrototype(instance, prototype, (methodName) => {
        const method = instance[methodName];
        const meta = this.reflector.get(ASYNC_EVENT_HANDLER, method);
        if (!meta) return;

        this.handlers.set(meta.event, {
          fn: method.bind(instance),
          dedupeTtl: meta.options?.dedupeTtl ?? null,
        });
      });
    }
  }
}
