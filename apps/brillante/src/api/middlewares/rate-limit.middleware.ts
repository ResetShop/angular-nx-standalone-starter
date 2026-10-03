import { logger } from '@resetshop/util'
import type { Context, MiddlewareHandler } from 'hono'
import { isCloudflareWorker } from '../helpers/request-database'

/**
 * Subset of the Cloudflare Workers Rate Limiting binding that these middlewares rely on.
 * Counters are kept per Cloudflare location and are eventually consistent, so this is coarse
 * per-IP throttling. The authoritative brute-force defence is the database-backed per-account
 * lockout (`AUTH_MAX_FAILED_ATTEMPTS` / `AUTH_LOCKOUT_DURATION`).
 */
export interface RateLimitBinding {
	limit(options: { key: string }): Promise<{ success: boolean }>
}

/**
 * One binding per limited endpoint: a binding's `limit` and `period` are fixed in `wrangler.jsonc`,
 * and Cloudflare only supports 10 s or 60 s windows. `RATE_LIMIT_POLICY` is the single source of
 * truth for both the middleware (the `Retry-After` value) and the integration-test fake; a spec
 * asserts that `wrangler.jsonc` declares exactly these bindings, limits and periods.
 */
export const RATE_LIMIT_POLICY = Object.freeze({
	LOGIN_RATE_LIMITER: { limit: 5, periodSeconds: 60 },
	REFRESH_RATE_LIMITER: { limit: 10, periodSeconds: 60 },
	CHANGE_PASSWORD_RATE_LIMITER: { limit: 5, periodSeconds: 60 },
	FORGOT_PASSWORD_RATE_LIMITER: { limit: 5, periodSeconds: 60 },
	RESET_PASSWORD_RATE_LIMITER: { limit: 5, periodSeconds: 60 },
} as const)

export type RateLimiterBindingName = keyof typeof RATE_LIMIT_POLICY

export type RateLimitBindings = Partial<Record<RateLimiterBindingName, RateLimitBinding>>

/**
 * Returns the client IP. `cf-connecting-ip` is set by Cloudflare's edge and cannot be forged by the
 * client. On Workers it is the only source: a request that reaches the Worker without it (for
 * example a service-binding subrequest) shares the 'unknown' bucket instead of letting the caller
 * choose its own key through `x-forwarded-for`. The proxy headers are fallbacks for Node-based
 * runs (integration tests, local servers) only.
 */
export function getClientIp(c: Context): string {
	const cloudflareIp = c.req.header('cf-connecting-ip')
	if (cloudflareIp || isCloudflareWorker()) {
		return cloudflareIp ?? 'unknown'
	}
	const forwarded = c.req.header('x-forwarded-for')
	if (forwarded) {
		return forwarded.split(',')[0].trim()
	}
	return c.req.header('x-real-ip') ?? 'unknown'
}

/**
 * Throttling is part of the protection of login, token refresh and the password flows (forgot
 * password would otherwise allow email flooding), so a limiter that cannot decide refuses the
 * request instead of letting it through. Every such failure is logged.
 */
function unavailable(c: Context, endpoint: string, reason: string): Response {
	logger.error('RateLimit', `${reason}; refusing ${endpoint}`)
	return c.json({ error: 'Service temporarily unavailable. Please try again later.' }, 503)
}

function createRateLimiter(bindingName: RateLimiterBindingName, endpoint: string): MiddlewareHandler {
	return async (c, next) => {
		const binding = (c.env as RateLimitBindings | undefined)?.[bindingName]
		if (!binding) {
			return unavailable(c, endpoint, `Binding ${bindingName} is not configured`)
		}

		const ip = getClientIp(c)
		let allowed: boolean
		try {
			allowed = (await binding.limit({ key: ip })).success
		} catch (error) {
			return unavailable(c, endpoint, `Binding ${bindingName} failed: ${String(error)}`)
		}

		if (!allowed) {
			logger.security('rate_limit_hit', { endpoint, ip })
			c.header('Retry-After', String(RATE_LIMIT_POLICY[bindingName].periodSeconds))
			return c.json({ error: 'Too many requests. Please try again later.' }, 429)
		}

		return next()
	}
}

/** Limiter for POST /api/auth/login. */
export const loginRateLimiter = createRateLimiter('LOGIN_RATE_LIMITER', '/api/auth/login')

/** Limiter for POST /api/auth/refresh. */
export const refreshRateLimiter = createRateLimiter('REFRESH_RATE_LIMITER', '/api/auth/refresh')

/** Limiter for POST /api/auth/change-password. */
export const changePasswordRateLimiter = createRateLimiter('CHANGE_PASSWORD_RATE_LIMITER', '/api/auth/change-password')

/** Limiter for POST /api/auth/forgot-password. */
export const forgotPasswordRateLimiter = createRateLimiter('FORGOT_PASSWORD_RATE_LIMITER', '/api/auth/forgot-password')

/** Limiter for POST /api/auth/reset-password. */
export const resetPasswordRateLimiter = createRateLimiter('RESET_PASSWORD_RATE_LIMITER', '/api/auth/reset-password')
