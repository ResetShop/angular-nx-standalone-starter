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

// Cached module-level singleton - resolved lazily on first use from DI container.
// Since services are registered as container singletons, this caches the reference
// to avoid repeated container lookups while maintaining lazy initialization.
// This pattern prevents import-time resolution issues if the module is imported
// before the container is fully configured.
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
