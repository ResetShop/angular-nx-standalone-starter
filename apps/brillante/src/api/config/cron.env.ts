/**
 * Cron / token-maintenance env sub-schema.
 *
 * The two `TOKEN_CLEANUP_*` fields are raw `z.string().optional()` — clamping,
 * default fallback, and warning logs live at the call site
 * (`refresh-token.repository.ts`) because the bounds (100–10000 for the batch
 * size) are business-logic concerns, not schema validation. `CRON_SECRET` (the
 * bearer secret authorizing the token-cleanup endpoint) is likewise validated at
 * its call site (`auth.config.ts`). The cleanup schedule itself is the Cron
 * Trigger declared in `wrangler.jsonc`, not an env variable.
 *
 * Consumers must import `cronEnv` (or `parseCronEnv` / `seedCronEnv` for tests).
 * Direct `process.env[...]` access is ESLint-forbidden everywhere except files
 * matching `*.env.ts`.
 */
import { z } from 'zod'
import { createEnvHandler } from './env-utils'

const CronEnvSchema = z.object({
	TOKEN_CLEANUP_BATCH_SIZE: z.string().optional(),
	TOKEN_CLEANUP_MAX_BATCH_COUNT: z.string().optional(),
	CRON_SECRET: z.string().optional(),
})

export type CronEnv = z.infer<typeof CronEnvSchema>

// Empty — both token-cleanup fields and `CRON_SECRET` are optional, so `parseCronEnv({})` succeeds with
// everything undefined. Kept for structural symmetry with other sub-schemas.
const handler = createEnvHandler('cron', CronEnvSchema, {})

export const parseCronEnv = handler.parse
export const cronEnv = handler.proxy
export const seedCronEnv = handler.seed
export const resetCronEnv = handler.reset
