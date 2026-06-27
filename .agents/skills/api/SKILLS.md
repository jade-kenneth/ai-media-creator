---
name: api-nest-graphql
description: Build or update the NestJS GraphQL backend in this monorepo. Use for modules, resolvers, services, DTO/input changes, GraphQL schema updates, MongoDB models, and backend feature work inside apps/brgy-system-api.
---

## Goal

Implement backend changes with clean module boundaries and predictable GraphQL behavior.

## Rules

- Keep resolvers thin and services responsible for business logic.
- Keep GraphQL fields focused and avoid overfetching.
- Validate inputs and return clear errors.
- Follow the existing NestJS module structure.
- Avoid changing unrelated modules.

## Workflow

1. Inspect the current module, resolver, service, and model first.
2. Update only the necessary layers.
3. Keep changes consistent with existing patterns.
4. Note any frontend impact such as changed fields or inputs.
5. Summarize schema, resolver, and service changes clearly.
