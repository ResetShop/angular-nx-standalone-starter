import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { AuthService } from './auth.service';

const app = new Hono();
const authService = new AuthService();

// Schema definitions
const loginSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});

// Middleware to validate login request
app.post('/login', zValidator('json', loginSchema), async (c) => {
	try {
		const { email, password } = c.req.valid('json');

		const response = await authService.authenticate({ email, password });
		return c.json(response, 200);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Authentication failed';
		return c.json({ error: message }, 401);
	}
});

export default app;
