import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import { parseDurationToSeconds } from '../../utils/duration';
import { AuthService } from './auth.service';

const app = new Hono();
const authService = new AuthService();

// Cookie configuration for refresh token
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
	httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
	secure: process.env['NODE_ENV'] === 'production', // Only HTTPS in production
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

// POST /api/auth/logout - Revoke all refresh tokens for the authenticated user
// User is extracted from the authenticated context (set by verifyAccessToken middleware)
app.post('/logout', async (c) => {
	try {
		const user = (c as AuthenticatedContext).user;

		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		await authService.logout(Number(user.sub));

		// Delete the refresh token cookie
		deleteCookie(c, REFRESH_TOKEN_COOKIE_NAME, { path: '/' });

		return c.json({ message: 'Logged out successfully' });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Logout failed';
		return c.json({ error: message }, 500);
	}
});

export default app;
