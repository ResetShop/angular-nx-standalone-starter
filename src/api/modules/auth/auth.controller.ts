import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import { container } from '../../container';
import { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import { parseDurationToSeconds } from '../../utils/duration';

const app = new Hono();

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
		const { authService } = container.cradle;

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
	const { authService } = container.cradle;

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
	const { authService, pasetoService } = container.cradle;

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

export default app;
