import { Context, Next } from 'hono';
import { container, type Cradle } from '../container';

export interface AuthenticatedContext extends Context {
	user?: {
		sub: string;
		email: string;
		firstName: string;
		lastName: string;
	};
}

// Lazy service resolution - defers container access until first use
// This avoids import-time resolution issues if module is imported before container setup
let _pasetoService: Cradle['pasetoService'];
const getPasetoService = () => (_pasetoService ??= container.cradle.pasetoService);

/**
 * Hono middleware to validate Paseto access token from Authorization header
 */
export default async function verifyAccessToken(c: Context, next: Next) {
	const authHeader = c.req.header('Authorization');

	if (!authHeader?.startsWith('Bearer ')) {
		return c.json({ error: 'Missing or invalid Authorization header' }, 401);
	}

	const token = authHeader.substring(7); // Remove 'Bearer ' prefix

	try {
		const payload = await getPasetoService().verifyAccessToken(token);

		// Attach user info to context
		(c as AuthenticatedContext).user = {
			sub: payload.sub,
			email: payload.email,
			firstName: payload.firstName,
			lastName: payload.lastName,
		};

		await next();
	} catch (error) {
		console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
		return c.json({ error: 'Invalid or expired token' }, 401);
	}
}
