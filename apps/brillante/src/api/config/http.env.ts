/**
 * HTTP / hosting env sub-schema.
 *
 * Covers the listening port, CORS configuration, the SSR base path, and the
 * serverless mode flag. Also exports the `isServerless()` helper alongside its
 * source (`IS_SERVERLESS`). On Cloudflare Workers `CORS_ORIGIN` is required: password-reset
 * links are built from it, and the localhost default would silently put dead links in emails.
 *
 * Consumers must import `httpEnv` / `isServerless` (or `parseHttpEnv` /
 * `seedHttpEnv` for tests). Direct `process.env[...]` access is ESLint-forbidden
 * everywhere except files matching `*.env.ts`.
 */
import { parseDurationToSeconds } from '@resetshop/util'
import { z } from 'zod'
import { isCloudflareWorker } from '../helpers/request-database'
import { createEnvHandler } from './env-utils'

const DEFAULT_PORT = 4000
const DEFAULT_CORS_ORIGIN = 'http://localhost:4200'
const DEFAULT_CORS_MAX_AGE = parseDurationToSeconds('24h')

const HttpEnvSchema = z
	.object({
		BASE_HREF: z.string().optional(),
		IS_SERVERLESS: z
			.string()
			.optional()
			.transform((v) => v === 'true'),
		PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT).catch(DEFAULT_PORT),
		CORS_ORIGIN: z.string().optional(),
		CORS_MAX_AGE: z.coerce.number().int().positive().default(DEFAULT_CORS_MAX_AGE).catch(DEFAULT_CORS_MAX_AGE),
	})
	.superRefine((env, ctx) => {
		if (isCloudflareWorker() && !env.CORS_ORIGIN?.trim()) {
			ctx.addIssue({
				code: 'custom',
				path: ['CORS_ORIGIN'],
				message: 'is required on Cloudflare Workers (reset links are built from it); set it to the public origin',
			})
		}
	})
	.transform((env) => ({ ...env, CORS_ORIGIN: env.CORS_ORIGIN?.trim() || DEFAULT_CORS_ORIGIN }))

export type HttpEnv = z.infer<typeof HttpEnvSchema>

// Empty — every field has a schema-level default, so `parseHttpEnv({})` succeeds.
// Kept for structural symmetry with other sub-schemas; tests that need
// overrides pass them to `seedHttpEnv()`.
const handler = createEnvHandler('http', HttpEnvSchema, {})

export const parseHttpEnv = handler.parse
export const httpEnv = handler.proxy
export const seedHttpEnv = handler.seed
export const resetHttpEnv = handler.reset

/**
 * True when the app is running in a connection-pooled serverless environment: `IS_SERVERLESS=true`,
 * or the Cloudflare Workers runtime itself, so a Worker deployed without the flag can never take a
 * session-level advisory lock through Hyperdrive. Reads from the validated `httpEnv` rather than
 * `process.env` directly.
 */
export function isServerless(): boolean {
	return isCloudflareWorker() || httpEnv.IS_SERVERLESS
}
