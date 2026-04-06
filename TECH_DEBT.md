# Technical Debt

## Purpose

This document tracks verified technical debt currently visible in the backend codebase. It focuses on improvements that are known, actionable, and still pending.

## How To Read This

- `Priority`: suggested order of attention based on current risk.
- `Status`: current state in the repository.
- `Decision`: what should eventually be chosen or implemented.

## Current Debt Items

| Priority | Area | Debt | Why It Matters | Proposed Action | Status |
| --- | --- | --- | --- | --- | --- |
| High | TypeScript interop | `ms` currently uses `import ms = require('ms')` in order to work with the current CommonJS compiler setup | The fix works, but it mixes import styles and is a local workaround rather than a project-level decision | Decide whether to enable `esModuleInterop` in `tsconfig.json` and restore `import ms from 'ms'` for consistency | Pending |
| High | Prisma workflow | The project has Prisma schema and scripts, but no `prisma/migrations` directory | Local setup depends on `db push`, which is fast but weaker than a migration-based workflow for long-term maintenance and production safety | Decide whether the project should stay schema-push-first or move to `prisma migrate` with committed migrations | Pending |
| High | Local environment bootstrap | The backend required manual investigation before the database schema was pushed locally | New environments are easy to misconfigure, which slows down onboarding and debugging | Add a documented local setup flow covering install, `db:push`, env variables, and start commands | Pending |
| Medium | Error handling | Prisma errors currently surface through the global exception filter as generic unhandled exceptions | Runtime failures are harder to understand and harder to map to user-facing API responses | Add explicit Prisma error mapping in the global exception filter or dedicated database exception handling | Pending |
| Medium | TypeScript config | `tsconfig.json` currently reports warnings about missing `rootDir` and deprecated `baseUrl` behavior | These are migration signals from newer TypeScript versions and may turn into real breakage later | Add `rootDir`, revisit path alias strategy, and decide whether to silence or address deprecation warnings now | Pending |
| Medium | Editor/runtime mismatch | Prisma editor diagnostics still appear even though the backend build succeeds | This creates noise and makes it harder to distinguish real problems from stale language-service state | Refresh the TypeScript server and confirm whether any Prisma-specific config cleanup is still necessary | Pending |
| Medium | Auth endpoint observability | Recent auth issues required reading Nest logs manually to diagnose runtime failures | Low observability makes troubleshooting slower, especially during integration testing | Improve structured logging around registration, login, token generation, and password reset failures | Pending |
| Medium | API contract visibility | The API reference exists in Markdown only | The documentation is useful for humans, but not directly consumable by clients or tooling | Consider generating Swagger/OpenAPI from the Nest controllers and DTOs | Pending |
| Low | Config hygiene | There is no explicit project-wide decision yet on CommonJS vs cleaner ESM-style interop | This leaves small inconsistencies in imports and future package integration decisions | Record a clear compiler/module policy in project docs and align code style with it | Pending |
| Low | Development ergonomics | Some failures depended on manually restarting the server and manually rerunning checks | This increases iteration time during backend debugging | Prefer `start:dev` during development and consider documenting a standard dev loop | Pending |

## Notes By Area

### 1. TypeScript And Module Interop

- The current build works.
- The current `ms` fix is valid but tactical.
- The cleaner strategic option is to evaluate `esModuleInterop` and keep import style consistent across the codebase.

### 2. Prisma And Database Lifecycle

- Prisma client generation is already protected by `postinstall`.
- Database schema creation still depended on a manual `db:push` step.
- There is no committed migration history yet.

### 3. Error Handling And Debuggability

- Generic Nest logs were not enough to explain the root cause until the PostgreSQL log was inspected.
- Prisma-specific exceptions should be translated into clearer API responses and more targeted logs.

### 4. Tooling Warnings

- Current TypeScript warnings are about future compatibility, not immediate build failure.
- They should still be resolved intentionally before they become noisy or blocking in a later upgrade.

## Suggested Implementation Order

1. Decide the compiler interop strategy: keep localized CommonJS fixes or adopt `esModuleInterop`.
2. Formalize the Prisma database workflow: `db push` only versus committed migrations.
3. Improve local setup documentation so new environments do not fail on missing schema.
4. Add Prisma-aware exception handling.
5. Clean up TypeScript configuration warnings.
6. Improve observability and optional Swagger/OpenAPI generation.

## Out Of Scope For This File

- New product features.
- UI or frontend debt.
- Speculative refactors not grounded in current issues.