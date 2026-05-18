/**
 * Email env sub-schema.
 *
 * Covers the email provider selection and SMTP credentials. The cross-field
 * refinement that requires `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` when
 * `EMAIL_PROVIDER=nodemailer` is enforced inside the schema itself.
 *
 * Every backend file that needs an email env var must import `emailEnv` from
 * here (or `parseEmailEnv` / `seedEmailEnv` for tests). Direct `process.env`
 * access is ESLint-forbidden everywhere except files matching `*.env.ts`.
 */
import { z } from 'zod'
import { formatZodError } from './env-utils'

const DEFAULT_SMTP_PORT = 587
const DEFAULT_SMTP_FROM = 'noreply@example.com'

const EmailEnvSchema = z
	.object({
		EMAIL_PROVIDER: z.enum(['nodemailer', 'ethereal', 'noop']).default('nodemailer'),
		SMTP_HOST: z.string().optional(),
		SMTP_USER: z.string().optional(),
		SMTP_PASS: z.string().optional(),
		SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_SMTP_PORT),
		SMTP_SECURE: z
			.string()
			.optional()
			.transform((v) => v === 'true'),
		SMTP_FROM: z.string().default(DEFAULT_SMTP_FROM),
	})
	.superRefine((data, ctx) => {
		if (data.EMAIL_PROVIDER !== 'nodemailer') return
		const missing: Array<'SMTP_HOST' | 'SMTP_USER' | 'SMTP_PASS'> = []
		if (!data.SMTP_HOST) missing.push('SMTP_HOST')
		if (!data.SMTP_USER) missing.push('SMTP_USER')
		if (!data.SMTP_PASS) missing.push('SMTP_PASS')
		for (const field of missing) {
			ctx.addIssue({
				code: 'custom',
				path: [field],
				message: `${field} is required when EMAIL_PROVIDER=nodemailer`,
			})
		}
	})

export type EmailEnv = z.infer<typeof EmailEnvSchema>

export function parseEmailEnv(rawEnv: NodeJS.ProcessEnv): EmailEnv {
	return EmailEnvSchema.parse(rawEnv)
}

let cachedEmailEnv: Readonly<EmailEnv> | null = null

function initializeEmailEnv(): Readonly<EmailEnv> {
	if (cachedEmailEnv !== null) return cachedEmailEnv
	try {
		cachedEmailEnv = Object.freeze(parseEmailEnv(process.env))
		return cachedEmailEnv
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('FATAL: Environment validation failed (email domain):')
			console.error(formatZodError(error))
			console.error('\nSee docs/environment-variables.md for the required variables and delivery options.')
			process.exit(1)
		}
		throw error
	}
}

// REASON: Proxy traps intercept all property access; the target is never read directly.
export const emailEnv: Readonly<EmailEnv> = new Proxy({} as EmailEnv, {
	get(_target, prop) {
		return initializeEmailEnv()[prop as keyof EmailEnv]
	},
	has(_target, prop) {
		return prop in initializeEmailEnv()
	},
})

// ─── Test helpers ─────────────────────────────────────────────────────────────

const EMAIL_ENV_TEST_DEFAULTS: NodeJS.ProcessEnv = {
	EMAIL_PROVIDER: 'ethereal',
}

export function seedEmailEnv(overrides: Partial<Record<keyof EmailEnv, string>> = {}): void {
	cachedEmailEnv = Object.freeze(parseEmailEnv({ ...EMAIL_ENV_TEST_DEFAULTS, ...overrides }))
}

export function resetEmailEnv(): void {
	cachedEmailEnv = null
}
