import { Hono } from 'hono';
import { AuthService } from './auth.service';

const app = new Hono();
const authService = new AuthService();

app.post('/login', async (c) => {
	try {
		const body = await c.req.json();
		const { email, password } = body;

		if (!email || !password) {
			return c.json({ error: 'Email and password hash are required' }, 400);
		}

		const response = await authService.authenticate({ email, password });
		return c.json(response, 200);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Authentication failed';
		return c.json({ error: message }, 401);
	}
});

export default app;
