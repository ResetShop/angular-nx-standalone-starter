import {
	type AuthErrorResponse,
	isAuthError,
	LoginErrorCode,
	type LoginErrorResponse,
	PublicAuthErrorCode,
	toLoginErrorResponse,
} from '@contracts/auth/auth.errors'
import type { LoginRequest, LoginResponse, MeResponse, RefreshResponse } from '@contracts/auth/auth.types'
import { parseDurationToSeconds } from '@utils/duration'
import { timingSafeEqual } from 'crypto'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import {
	ACCESS_TOKEN_COOKIE_NAME,
	DEFAULT_ACCESS_TOKEN_EXPIRY,
	DEFAULT_REFRESH_TOKEN_EXPIRY,
	MIN_CRON_SECRET_LENGTH,
	REFRESH_TOKEN_COOKIE_NAME,
} from '../../constants/auth.constants'
import { container } from '../../container/container'
import type { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware'
import { createOpenAPIApp, registerRoute } from '../../openapi-app'
import { logger } from '../../utils/logger'
import { cleanupTokensRoute, loginRoute, logoutRoute, meRoute, refreshRoute } from './auth.routes'

const app = createOpenAPIApp()

// WARNING: COOKIE_SECURE=false must ONLY be used in local development (no HTTPS).
// In production, omit the variable entirely — it defaults to true (HTTPS required).
const BASE_COOKIE_OPTIONS = {
	httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
	secure: process.env['COOKIE_SECURE'] !== 'false', // Defaults to true; false only for local dev
	sameSite: 'Strict' as const, // CSRF protection
	path: '/',
}

const REFRESH_TOKEN_COOKIE_OPTIONS = {
	...BASE_COOKIE_OPTIONS,
	maxAge: parseDurationToSeconds(process.env['PASETO_REFRESH_TOKEN_EXPIRY'] ?? DEFAULT_REFRESH_TOKEN_EXPIRY),
}

const ACCESS_TOKEN_COOKIE_OPTIONS = {
	...BASE_COOKIE_OPTIONS,
	maxAge: parseDurationToSeconds(process.env['PASETO_ACCESS_TOKEN_EXPIRY'] ?? DEFAULT_ACCESS_TOKEN_EXPIRY),
}

/**
 * POST /api/auth/login - Authenticate user
 *
 * Authenticates a user with email and password. Implements account lockout
 * protection after multiple failed login attempts.
 *
 * @route POST /api/auth/login
 * @body {LoginRequest} - Email and password
 *
 * @returns {200} LoginResponse - Successfully authenticated
 * @returns {401} Error - Authentication failed
 *
 * Error responses (401):
 * - "Invalid credentials" - Email/password combination is incorrect
 * - "Account is temporarily locked due to too many failed login attempts" - Account locked after max failed attempts (default: 5)
 * - "Account is disabled" - User account has been disabled by an administrator
 * - "Account is deleted" - User account has been soft-deleted
 *
 * Security features:
 * - Failed login attempt tracking
 * - Automatic account lockout after configurable threshold (AUTH_MAX_FAILED_ATTEMPTS, default: 5)
 * - Configurable lockout duration (AUTH_LOCKOUT_DURATION, default: 15m)
 * - Timing-safe password comparison (prevents timing attacks)
 * - Constant-time response for invalid emails (prevents user enumeration)
 * - Both tokens set as HttpOnly, Secure, SameSite=Strict cookies
 */
registerRoute(app, loginRoute, async (c) => {
	const { authService } = container.cradle

	try {
		const { email, password }: LoginRequest = c.req.valid('json')

		const response = await authService.authenticate({ email, password })

		// Set tokens as HttpOnly cookies
		setCookie(c, REFRESH_TOKEN_COOKIE_NAME, response.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS)
		setCookie(c, ACCESS_TOKEN_COOKIE_NAME, response.token, ACCESS_TOKEN_COOKIE_OPTIONS)

		// Return only user info (both tokens are in cookies)
		return c.json<LoginResponse>(
			{
				user: response.user,
				mustChangePassword: response.mustChangePassword,
			},
			200,
		)
	} catch (error) {
		if (isAuthError(error)) {
			return c.json<LoginErrorResponse>(toLoginErrorResponse(error), 401)
		}

		// Unknown error - use generic response
		return c.json<LoginErrorResponse>({ code: LoginErrorCode.GENERIC, message: 'Authentication failed' }, 401)
	}
})

// POST /api/auth/refresh - Exchange refresh token for new access + refresh tokens
registerRoute(app, refreshRoute, async (c) => {
	const { authService } = container.cradle

	try {
		// Read refresh token from HttpOnly cookie
		const refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE_NAME)

		if (!refreshToken) {
			return c.json<AuthErrorResponse>(
				{ code: PublicAuthErrorCode.TOKEN_INVALID, message: 'No refresh token provided' },
				401,
			)
		}

		const response = await authService.refreshToken(refreshToken)

		// Update both token cookies
		setCookie(c, REFRESH_TOKEN_COOKIE_NAME, response.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS)
		setCookie(c, ACCESS_TOKEN_COOKIE_NAME, response.token, ACCESS_TOKEN_COOKIE_OPTIONS)

		// No body needed — tokens are in cookies
		return c.json<RefreshResponse>({}, 200)
	} catch (error) {
		if (isAuthError(error)) {
			return c.json<AuthErrorResponse>({ code: error.publicCode, message: error.message }, 401)
		}

		// Unknown error (e.g., PASETO verification failure)
		return c.json<AuthErrorResponse>({ code: PublicAuthErrorCode.TOKEN_INVALID, message: 'Token refresh failed' }, 401)
	}
})

// GET /api/auth/me - Token introspection endpoint
// Returns the current authenticated user's information with roles and permissions
// Useful for verifying token validity, getting user data, and frontend authorization
registerRoute(app, meRoute, async (c) => {
	const { userRoleService } = container.cradle
	const user = (c as AuthenticatedContext).user

	if (!user) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const userId = Number(user.sub)

	// Fetch roles with their nested permissions
	const roles = await userRoleService.getUserRolesWithPermissions(userId)

	return c.json<MeResponse>({
		id: userId,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		roles,
	})
})

// POST /api/auth/logout - Revoke all refresh tokens for the user
// Uses refresh token from cookie to identify user (no access token needed)
// Always succeeds from client perspective - cleans up what it can
registerRoute(app, logoutRoute, async (c) => {
	const { authService, pasetoService } = container.cradle

	// Get refresh token before deleting cookie
	const refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE_NAME)

	// Always delete both cookies (flags must match creation options for correct targeting)
	deleteCookie(c, ACCESS_TOKEN_COOKIE_NAME, BASE_COOKIE_OPTIONS)
	deleteCookie(c, REFRESH_TOKEN_COOKIE_NAME, BASE_COOKIE_OPTIONS)

	try {
		if (!refreshToken) {
			// No refresh token = nothing to revoke, still success
			return c.json({ message: 'Logged out successfully' })
		}

		// Verify refresh token and get user ID
		const payload = await pasetoService.verifyRefreshToken(refreshToken)
		await authService.logout(Number(payload.sub))

		return c.json({ message: 'Logged out successfully' })
	} catch {
		// Even if token verification fails, logout is still "successful"
		// Cookie is already deleted, user is effectively logged out
		return c.json({ message: 'Logged out successfully' })
	}
})

// GET /api/auth/cleanup-tokens - Manually trigger expired token cleanup
// Public endpoint but protected by CRON_SECRET for Vercel Cron Jobs
// Also allows authenticated users to call it manually
registerRoute(app, cleanupTokensRoute, async (c) => {
	const cronSecret = process.env['CRON_SECRET']
	const authHeader = c.req.header('Authorization')
	const user = (c as AuthenticatedContext).user

	// Validate CRON_SECRET length (warning logged at startup in cron-jobs.ts)
	const isSecretValid = cronSecret && cronSecret.length >= MIN_CRON_SECRET_LENGTH

	// Check authorization: either valid cron secret or authenticated user
	// Use timing-safe comparison to prevent timing attacks on the secret
	const isValidCronRequest =
		isSecretValid &&
		authHeader &&
		(() => {
			const expected = Buffer.from(`Bearer ${cronSecret}`)
			const actual = Buffer.from(authHeader)
			return expected.length === actual.length && timingSafeEqual(expected, actual)
		})()
	const isAuthenticatedUser = !!user

	if (!isValidCronRequest && !isAuthenticatedUser) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	try {
		const { tokenMaintenanceService } = container.cradle
		const result = await tokenMaintenanceService.cleanupExpiredTokens()

		if (result === null) {
			return c.json({
				message: 'Cleanup already in progress',
				deletedCount: 0,
				incomplete: false,
			})
		}

		return c.json({
			message: result.incomplete ? 'Cleanup incomplete - max batch limit reached' : 'Cleanup completed',
			deletedCount: result.deletedCount,
			incomplete: result.incomplete,
		})
	} catch (error) {
		logger.error('TokenCleanup', 'Cleanup endpoint error', error)
		return c.json({ error: 'Cleanup failed' }, 500)
	}
})

export default app
