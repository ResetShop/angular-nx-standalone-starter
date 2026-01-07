import { zValidator } from '@hono/zod-validator';
import { timingSafeEqual } from 'crypto';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import { pasetoService } from '../../services/paseto.service';
import { parseDurationToSeconds } from '../../utils/duration';
import { AuthService } from './auth.service';

const app = new Hono();
const authService = new AuthService();

// Cookie configuration for refresh token
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
	httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
	secure: process.env['COOKIE_SECURE'] !== 'false', // HTTPS based on COOKIE_SECURE env var value
	sameSite: 'Strict' as const, // CSRF protection
	path: '/',
	maxAge: parseDurationToSeconds(process.env['PASETO_REFRESH_TOKEN_EXPIRY'] ?? '7d'), // Default of 7 days
};

// POST /api/auth/login - Authenticate user
app.post(
	'/login',
	zValidator(
		'json',
		z.object({
			email: z.email('Invalid email format'),
			password: z.string().min(1, 'Password is required'),
		}),
	),
	async (c) => {
		try {
			const { email, password } = c.req.valid('json');

			const response = await authService.authenticate({ email, password });

			// Set refresh token as HttpOnly cookie
			setCookie(c, REFRESH_TOKEN_COOKIE_NAME, response.refreshToken, COOKIE_OPTIONS);

			// Return only access token and user info (refresh token is in cookie)
			return c.json(
				{
					user: response.user,
					token: response.token,
				},
				200,
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Authentication failed';
			return c.json({ error: message }, 401);
		}
	},
);

// POST /api/auth/refresh - Exchange refresh token for new access + refresh tokens
app.post('/refresh', async (c) => {
	try {
		// Read refresh token from HttpOnly cookie
		const refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE_NAME);

		if (!refreshToken) {
			return c.json({ error: 'No refresh token provided' }, 401);
		}

		const response = await authService.refreshToken(refreshToken);

		// Update refresh token cookie with new token
		setCookie(c, REFRESH_TOKEN_COOKIE_NAME, response.refreshToken, COOKIE_OPTIONS);

		// Return only new access token (refresh token is in cookie)
		return c.json(
			{
				token: response.token,
			},
			200,
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Token refresh failed';
		return c.json({ error: message }, 401);
	}
});

// GET /api/auth/me - Token introspection endpoint
// Returns the current authenticated user's information from the token
// Useful for verifying token validity and getting user data
app.get('/me', (c) => {
	const user = (c as AuthenticatedContext).user;

	if (!user) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	return c.json({
		id: user.sub,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
	});
});

// POST /api/auth/logout - Revoke all refresh tokens for the user
// Uses refresh token from cookie to identify user (no access token needed)
// Always succeeds from client perspective - cleans up what it can
app.post('/logout', async (c) => {
	// Get refresh token before deleting cookie
	const refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE_NAME);

	// Always delete the cookie
	deleteCookie(c, REFRESH_TOKEN_COOKIE_NAME, { path: '/' });

	try {
		if (!refreshToken) {
			// No refresh token = nothing to revoke, still success
			return c.json({ message: 'Logged out successfully' });
		}

		// Verify refresh token and get user ID
		const payload = await pasetoService.verifyRefreshToken(refreshToken);
		await authService.logout(Number(payload.sub));

		return c.json({ message: 'Logged out successfully' });
	} catch {
		// Even if token verification fails, logout is still "successful"
		// Cookie is already deleted, user is effectively logged out
		return c.json({ message: 'Logged out successfully' });
	}
});

// Minimum length for CRON_SECRET (32 chars = 256 bits of entropy when hex-encoded)
const MIN_CRON_SECRET_LENGTH = 32;

// GET /api/auth/cleanup-tokens - Manually trigger expired token cleanup
// Public endpoint but protected by CRON_SECRET for Vercel Cron Jobs
// Also allows authenticated users to call it manually
app.get('/cleanup-tokens', async (c) => {
	const cronSecret = process.env['CRON_SECRET'];
	const authHeader = c.req.header('Authorization');
	const user = (c as AuthenticatedContext).user;

	// Validate CRON_SECRET length (warning logged at startup in cron-jobs.ts)
	const isSecretValid = cronSecret && cronSecret.length >= MIN_CRON_SECRET_LENGTH;

	// Check authorization: either valid cron secret or authenticated user
	// Use timing-safe comparison to prevent timing attacks on the secret
	const isValidCronRequest =
		isSecretValid &&
		authHeader &&
		(() => {
			const expected = Buffer.from(`Bearer ${cronSecret}`);
			const actual = Buffer.from(authHeader);
			return expected.length === actual.length && timingSafeEqual(expected, actual);
		})();
	const isAuthenticatedUser = !!user;

	if (!isValidCronRequest && !isAuthenticatedUser) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	try {
		const deletedCount = await authService.cleanupExpiredTokens();

		if (deletedCount === -1) {
			return c.json({
				message: 'Cleanup already in progress',
				deletedCount: 0,
			});
		}

		return c.json({
			message: 'Cleanup completed',
			deletedCount,
		});
	} catch (error) {
		console.error('[TokenCleanup] Error:', error);
		return c.json({ error: 'Cleanup failed' }, 500);
	}
});

export default app;
