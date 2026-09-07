# A DJAL API contract

This standalone package is the versioned source of truth for the HTTP contract.

- `openapi.yaml` is reviewed before a contract version is released.
- `pnpm run codegen` regenerates the React Query client and Zod schemas.
- Consumers install `@adjal/api-contract` and import `@adjal/api-contract/react` or `@adjal/api-contract/zod`.
- A breaking API change requires a major version; additive changes use a minor version.
