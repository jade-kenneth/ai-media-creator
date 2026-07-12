# Code style

Use these rules for new code and focused refactors. Follow the local application pattern when it is more specific.

## Naming

- Use descriptive names that communicate domain intent.
- Use `PascalCase` for components, classes, types, and enums.
- Use `camelCase` for functions, variables, hooks, and object properties.
- Prefix React hooks with `use`.
- Avoid generic names such as `data`, `item`, `handler`, or `utils` when a domain-specific name is available.

## TypeScript

- Prefer explicit domain types over `any` and broad type assertions.
- Validate untrusted input at the boundary.
- Keep public function contracts small and intentional.
- Model impossible states out of the type system where practical.

## Error handling

- Fail with actionable, domain-appropriate errors.
- Preserve the original cause when translating infrastructure errors.
- Do not expose secrets, stack traces, database details, or provider payloads to clients.
- Log enough structured context to diagnose failures without logging credentials or sensitive personal data.

## API contracts

GraphQL operations return typed domain payloads directly. Do not add an extra REST-style response envelope such as `{ success, message, data }` unless an external integration explicitly requires it.

Keep authorization and tenant checks on the server. Client-side visibility is not an authorization boundary.

## UI and state

- Keep server state in the established query layer.
- Keep transient interface state local unless multiple distant surfaces truly share it.
- Reuse established components before introducing a parallel pattern.
- Include loading, empty, error, disabled, and success states for user-triggered operations.

## Testing

Test observable behavior and contract shape rather than private implementation details. Include rejected input, authorization, tenant isolation, and error cases—not only the happy path.
