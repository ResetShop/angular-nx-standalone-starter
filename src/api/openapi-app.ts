import type { RouteConfig } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context, Env } from 'hono';

export function createOpenAPIApp<E extends Env = Env>(): OpenAPIHono<E> {
	return new OpenAPIHono<E>();
}

/**
 * Input type that makes c.req.valid() return 'any' for all validation targets.
 *
 * REASON: @hono/zod-openapi infers handler context types from route schemas.
 * When schemas are plain 'zod' (not the re-exported '@hono/zod-openapi' z),
 * Hono's InputToDataByTarget resolves c.req.valid() to 'never' and destructured
 * properties to '{}'. This input type provides the 'out' shape that Hono's type
 * utility needs to return usable types. Preserves full type safety on c.json(),
 * c.html(), c.req.param(), etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyValidationInput = { out: { json: any; query: any; form: any; param: any; header: any; cookie: any } };

/** Context with relaxed validation types — see AnyValidationInput. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenAPIContext<E extends Env = Env> = Context<E, any, AnyValidationInput>;

/**
 * Wrapper for app.openapi() that relaxes handler types.
 * Handlers are verified through unit tests rather than compile-time checks.
 */
export function registerRoute<E extends Env>(
	app: OpenAPIHono<E>,
	route: RouteConfig,
	handler: (c: OpenAPIContext<E>) => Promise<Response>,
): void {
	// REASON: app.openapi() expects strictly typed handler — see AnyValidationInput above
	(app as any).openapi(route, handler); // eslint-disable-line @typescript-eslint/no-explicit-any
}
