import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import { AuthService } from './auth.service';

const app = new Hono();
const authService = new AuthService();

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
			return c.json(response, 200);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Authentication failed';
			return c.json({ error: message }, 401);
		}
	},
);

// POST /api/auth/refresh - Exchange refresh token for new access + refresh tokens
app.post(
	'/refresh',
	zValidator(
		'json',
		z.object({
			refreshToken: z.string().min(1, 'Refresh token is required'),
		}),
	),
	async (c) => {
		try {
			const { refreshToken } = c.req.valid('json');

			const response = await authService.refreshToken(refreshToken);
			return c.json(response, 200);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Token refresh failed';
			return c.json({ error: message }, 401);
		}
	},
);

// POST /api/auth/logout - Revoke all refresh tokens for the authenticated user
app.post('/logout', async (c) => {
	try {
		const user = (c as AuthenticatedContext).user;

		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		await authService.logout(Number(user.sub));

		return c.json({ message: 'Logged out successfully' });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Logout failed';
		return c.json({ error: message }, 500);
	}
});

export default app;
