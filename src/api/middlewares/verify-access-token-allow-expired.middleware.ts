import { Context, Next } from 'hono';
import { pasetoService } from '../services/paseto.service';

export interface AuthenticatedContext extends Context {
	user?: {
		sub: string;
		email: string;
		firstName: string;
		lastName: string;
	};
}

/**
 * Hono middleware to validate Paseto access token from Authorization header,
 * allowing expired tokens. Use ONLY for logout endpoint.
 */
export default async function verifyAccessTokenAllowExpired(c: Context, next: Next) {
	const authHeader = c.req.header('Authorization');

	if (!authHeader?.startsWith('Bearer ')) {
		return c.json({ error: 'Missing or invalid Authorization header' }, 401);
	}

	const token = authHeader.substring(7);

	try {
		const payload = await pasetoService.verifyAccessTokenIgnoreExpiration(token);

		(c as AuthenticatedContext).user = {
			sub: payload.sub,
			email: payload.email,
			firstName: payload.firstName,
			lastName: payload.lastName,
		};

		await next();
	} catch {
		return c.json({ error: 'Invalid token' }, 401);
	}
}
