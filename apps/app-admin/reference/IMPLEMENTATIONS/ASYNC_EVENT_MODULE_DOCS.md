# Async Event Module (Plain-English Guide)

This module lets the server **send work to the background** so user actions stay fast.  
Instead of doing everything right away, it posts a small message to a queue and another worker picks it up.

## What it does (in simple terms)
- **When something happens**, the app creates a small “event message.”
- **That message is sent to Kafka** (a message queue).
- **A background consumer listens** and runs the actual work.
- **Redis is optional** and only used if you enable it in config.

## Where it lives
- File: `apps/ecommerce-server/src/libs/async-event-module/async-event-module.ts`
- Module name: `AsyncEventModule`

## What gets created
When the module starts, it builds:
- A Kafka client
- A Kafka producer (for sending events)
- A Kafka consumer (for receiving events)
- A handler map (where event handlers are stored)
- Optional Redis client

## The topic and group
Both use the **context** you provide:
- Topic: `async-event-{context}`
- Consumer group: `async-event-{context}`

This keeps different apps/environments from mixing their messages.

## Required settings
You must provide a config factory when calling `forRootAsync`, for example:
- `context` (string)
- `kafka.brokers` (list of broker addresses)
- `kafka.clientId` (optional; falls back to `context`)

Optional:
- `redis.host`
- `redis.port`

## Environment variables used
- `KAFKA_USERNAME`
- `KAFKA_PASSWORD`
- `REDISPASSWORD` (only if Redis is enabled)

## How a request flows
1. A user action triggers an event (e.g., send email).
2. The producer sends it to Kafka.
3. The consumer picks it up.
4. A registered handler does the work in the background.

## Common issues (plain language)
- **No events are processed**  
  Check Kafka connection, broker address, and credentials.

- **Events show up in the wrong app**  
  Ensure each environment uses a unique `context`.

- **Redis errors**  
  If you don’t need Redis, leave the `redis` config out.

## Good to know
- SSL + SASL are enabled in the Kafka client for Redpanda Cloud.  
  If you are using local Kafka, you’ll likely remove those settings.

---

# Prompt (Generated From This Doc)

Use this prompt to scaffold an Async Event Module in this codebase:

```txt
You are a senior NestJS engineer. Scaffold an Async Event Module for a backend service so events are produced and consumed through Kafka, with optional Redis deduplication.

Requirements:

1) Create a global DynamicModule named `AsyncEventModule` with `forRootAsync`.
2) Module should initialize:
   - Kafka client
   - Kafka producer
   - Kafka consumer
   - handler registry map (`Map<string, any>`)
   - optional Redis client
3) Topic and group naming must be context-based:
   - topic: `async-event-{context}`
   - consumer group: `async-event-{context}`
4) Support options shape:
   - `context: string`
   - `kafka.brokers: string[]`
   - `kafka.clientId?: string` (fallback to `context`)
   - optional `redis.host`, `redis.port`
   - optional `concurrency`
5) Add dispatcher and producer:
   - dispatcher method `dispatch(type, data, { id? })`
   - producer sends JSON event with `headers.type`
6) Add consumer that:
   - discovers handlers via Nest DiscoveryService + MetadataScanner + Reflector
   - reads event type from Kafka header
   - executes matching handler
   - applies optional Redis dedupe using key `async-event:{type}:{event.id}` and `dedupeTtl`
7) Add decorator:
   - `@AsyncEventHandler(eventType, { dedupeTtl? })`
8) Add typed event contracts:
   - `AsyncEventPayloads`
   - `AsyncEventType`
   - `AsyncEvent<TType>`
9) Wire module in `AppModule` using `forRootAsync` and environment-based config.
10) Include usage examples:
    - dispatch `SuccessfulSignup` from a service
    - consume it in an email handler class

Environment notes:
- Kafka creds: `KAFKA_USERNAME`, `KAFKA_PASSWORD`
- Redis password: `REDISPASSWORD` (if Redis is enabled)
- For Redpanda Cloud keep SSL/SASL settings; for local Kafka allow disabling them.

Output format:
- show created/updated file list first
- include complete code per file
- include a short verification checklist (producer, consumer, handler discovery, dedupe path)
```
