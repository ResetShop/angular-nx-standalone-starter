import { logger, parseDurationToMs } from '@resetshop/util'
import type { Context } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import {
	DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_MAX,
	DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_WINDOW,
	LOGIN_RATE_LIMIT_MAX,
	LOGIN_RATE_LIMIT_WINDOW,
	REFRESH_RATE_LIMIT_MAX,
	REFRESH_RATE_LIMIT_WINDOW,
} from '../constants/auth.constants'

/**
 * Extracts the client IP address from proxy headers.
 * Falls back to 'unknown' when no IP can be determined.
 */
export function getClientIp(c: Context): string {
	const forwarded = c.req.header('x-forwarded-for')
	if (forwarded) {
		return forwarded.split(',')[0].trim()
	}
	return c.req.header('x-real-ip') ?? 'unknown'
}

function createRateLimitHandler(endpoint: string) {
	return (c: Context) => {
		logger.security('rate_limit_hit', { endpoint, ip: getClientIp(c) })
		return c.json({ error: 'Too many requests. Please try again later.' }, 429)
	}
}

/** Rate limiter for POST /api/auth/login — 5 attempts per 15 minutes per IP. */
export const loginRateLimiter = rateLimiter({
	windowMs: parseDurationToMs(LOGIN_RATE_LIMIT_WINDOW),
	limit: LOGIN_RATE_LIMIT_MAX,
	standardHeaders: 'draft-7',
	keyGenerator: getClientIp,
	handler: createRateLimitHandler('/api/auth/login'),
})

/** Rate limiter for POST /api/auth/refresh — 10 attempts per 1 minute per IP. */
export const refreshRateLimiter = rateLimiter({
	windowMs: parseDurationToMs(REFRESH_RATE_LIMIT_WINDOW),
	limit: REFRESH_RATE_LIMIT_MAX,
	standardHeaders: 'draft-7',
	keyGenerator: getClientIp,
	handler: createRateLimitHandler('/api/auth/refresh'),
})

/**
 * Rate limiter for POST /api/auth/change-password — defaults to 5 attempts per 15 minutes per IP.
 * Window and limit are overridable via AUTH_CHANGE_PASSWORD_RATE_LIMIT_WINDOW / _MAX.
 */
export const changePasswordRateLimiter = rateLimiter({
	windowMs: parseDurationToMs(
		process.env['AUTH_CHANGE_PASSWORD_RATE_LIMIT_WINDOW'] || DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_WINDOW,
	),
	limit: Number(process.env['AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX']) || DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_MAX,
	standardHeaders: 'draft-7',
	keyGenerator: getClientIp,
	handler: createRateLimitHandler('/api/auth/change-password'),
})
