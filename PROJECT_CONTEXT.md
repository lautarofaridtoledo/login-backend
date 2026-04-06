# Project Context

## Purpose

This document tracks verified technical changes and current operational context for the backend authentication service. It is written as a logbook so future sessions can recover what changed, why it changed, and what is still pending.

## Project Snapshot

- Stack: NestJS 10, Prisma, PostgreSQL, Passport JWT, cookie-based refresh tokens.
- API prefix: `/api`.
- Main domain covered today: authentication, token rotation, password reset, runtime/build troubleshooting.
- Source of truth: current workspace state in `backend/`.

## Logbook

### 2026-04-03 - Start Script Investigation

**Issue**

Running the backend start script failed during application bootstrap.

**Action**

- Executed the project start command from `backend/`.
- Traced the failure to Prisma initialization in the database layer.
- Verified that the application boot sequence completed Nest module loading before the crash.

**Outcome**

- The actual runtime blocker was a Prisma database authentication error, not a NestJS bootstrap failure.
- Prisma raised `P1000`, indicating invalid database credentials for the configured PostgreSQL connection.
- The configured datasource comes from `DATABASE_URL` and currently targets `postgresql://postgres:postgres@localhost:5432/auth_service?schema=public`.

**Impact**

- The backend can compile and boot through Nest initialization, but it cannot become operational until the PostgreSQL credentials are valid.

**Pending**

- Confirm the correct local PostgreSQL username and password.
- Ensure the `auth_service` database exists and matches the configured connection string.

### 2026-04-05 - Prisma Client Import Investigation

**Issue**

The editor reported that `@prisma/client` did not export `PrismaClient`, and `PrismaService` therefore appeared to be missing `$connect()` and `$disconnect()`.

**Action**

- Reviewed TypeScript diagnostics for the backend and inspected the Prisma service implementation.
- Inspected the installed `@prisma/client` package and confirmed it re-exported generated types from Prisma output.
- Verified that the generated client artifacts were missing from the installation state used by `pnpm`.
- Ran `pnpm prisma generate` from `backend/` to regenerate the Prisma Client.

**Outcome**

- The Prisma client generation step restored the generated artifacts needed by `@prisma/client`.
- After generation, the next actual build blocker moved away from Prisma and surfaced a separate missing dependency.

**Impact**

- The Prisma import problem was identified as a generated-client availability issue, not a code-level import syntax problem in the service itself.

**Pending**

- VS Code may still show stale TypeScript diagnostics until the TypeScript server refreshes.
- The runtime database credential issue remains independent and still needs to be resolved.

### 2026-04-05 - Package Hardening For pnpm

**Issue**

The project behavior was more fragile under `pnpm` because Prisma Client generation was not guaranteed after dependency installation.

**Action**

- Added a `postinstall` script to `package.json` with `prisma generate`.

**Outcome**

- Future installs now regenerate Prisma Client automatically after dependency installation.
- This reduces the chance of missing generated Prisma artifacts when the project is installed with `pnpm`.

**Impact**

- The repository is now more deterministic across fresh installs and package manager differences.

**Pending**

- None for this change.

### 2026-04-05 - Missing Runtime Dependency In Token Service

**Issue**

The backend imported `ms` in the token service, but the dependency was not declared in the project package manifest.

**Action**

- Added `ms` to runtime dependencies.
- Added `@types/ms` to development dependencies.

**Outcome**

- The token service dependency graph now matches the implementation.
- The build can resolve the duration parsing helper used to derive JWT expiration values.

**Impact**

- The backend build no longer fails on `Cannot find module 'ms'`.

**Pending**

- None for this change.

### 2026-04-05 - Database Schema Sync For Local Registration

**Issue**

After fixing database credentials, the `register` flow still failed on `this.prisma.user.findUnique()` because PostgreSQL reported that `public.users` did not exist.

**Action**

- Traced the register flow through the users repository and confirmed the code assumes the Prisma tables already exist.
- Verified that the repository had no Prisma migrations and was relying on schema sync for local setup.
- Applied `pnpm db:push` against the configured local database.

**Outcome**

- The Prisma schema was pushed to the local PostgreSQL database.
- The missing `users` table issue was identified as a database provisioning problem, not a bug in the register logic.

**Impact**

- Local auth flows can now reach the next runtime step instead of failing immediately on the first user lookup.

**Pending**

- None for this change.

### 2026-04-05 - ms CommonJS Interop Fix

**Issue**

After the schema was pushed, register failed during token generation with `TypeError: (0 , ms_1.default) is not a function`.

**Action**

- Reviewed the `ms` package export style and confirmed it is a CommonJS export.
- Updated the import in `src/modules/tokens/tokens.service.ts` from a default import to `import ms = require('ms');`.
- Rebuilt the backend with `pnpm build` to verify the fix.

**Outcome**

- The backend now compiles with a runtime-safe `ms` import under the current TypeScript CommonJS configuration.
- The specific token-generation runtime error was removed from the known blockers.

**Impact**

- Register, login, and refresh no longer depend on a broken default import for duration parsing.

**Pending**

- Decide later whether to keep the localized import fix or move the project to `esModuleInterop` for cleaner ESM-style imports.

## Current Known State

### Working

- The backend package manifest includes the missing `ms` dependency and the Prisma `postinstall` generation hook.
- The project build progressed past the Prisma import problem after regenerating Prisma Client.
- The local Prisma schema has been pushed to PostgreSQL, so the auth tables now exist for the current database.
- The `ms` runtime interop issue in the token service has been fixed and verified with `pnpm build`.
- The auth module exposes register, login, refresh, logout, verify, me, forgot-password, and reset-password endpoints.

### Still Open

- The editor currently reports TypeScript warnings in `tsconfig.json` related to newer TypeScript behavior around `rootDir` and `baseUrl` deprecation.
- The editor may continue to show stale Prisma diagnostics until the TypeScript language service is refreshed.

## Why pnpm Exposed Prisma More Clearly

- `@prisma/client` depends on generated output created by `prisma generate`.
- With `npm`, this can appear to work transparently because installation flow and module layout often leave the generated client in place.
- With `pnpm`, dependency layout is stricter and more symlink-driven, so missing generated artifacts are easier to notice.
- The fix is not to change the import syntax, but to ensure generation happens reliably after install.

## Next Recommended Steps

1. Re-run the register flow end-to-end now that the database schema and token import issues are fixed.
2. Refresh the VS Code TypeScript server if Prisma diagnostics remain visible in the editor.
3. Decide whether to update `tsconfig.json` now for TypeScript 5.9+ compatibility warnings.
4. Decide whether to keep the localized `ms` import fix or switch the project to `esModuleInterop` for cleaner import style.