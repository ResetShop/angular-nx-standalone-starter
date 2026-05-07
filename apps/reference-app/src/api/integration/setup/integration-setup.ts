/**
 * Vitest setupFile — runs in every worker before each test file. Vitest 4
 * re-evaluates this for each file even with `isolate: false`, so anything
 * here must be idempotent or globally guarded.
 *
 * The heavy work (schema push + seed + embedded-pg lifecycle) lives in
 * `global-setup.ts` (vitest globalSetup), which runs ONCE per suite in the
 * CLI process before any worker forks. That sets `PG_TEST_CONNECTION_STRING`
 * + `PG_CONNECTION_STRING` env vars; workers inherit them via fork() and the
 * `drizzle-postgres-connector.ts` picks them up at module-load.
 *
 * The only per-file work needed is re-installing the Zod ↔ OpenAPI bridge,
 * which mutates the Zod prototype lazily; the cost is negligible and it has
 * to be in place before any contract schema is imported.
 */
import { extendZodWithOpenApi } from '@hono/zod-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)
