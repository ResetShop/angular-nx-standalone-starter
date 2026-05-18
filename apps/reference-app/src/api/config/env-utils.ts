/**
 * Shared helpers used by every env sub-schema module.
 *
 * Each sub-schema (`db.env.ts`, `auth.env.ts`, etc.) follows the same lazy-init
 * pattern: on first property access, the Proxy calls a domain-specific
 * `initializeXEnv()` that parses `process.env` via the domain's schema and
 * `process.exit(1)`-on-failure with a formatted error message. The `formatZodError`
 * helper here keeps the error formatting consistent across domains so a single
 * change applies to every sub-schema's FATAL output.
 *
 * This file does not itself read `process.env` — the sub-schemas pass their
 * parsed `z.ZodError` instance.
 */
import { type z } from 'zod'

export function formatZodError(error: z.ZodError): string {
	return error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n')
}
