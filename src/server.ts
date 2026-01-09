import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { isMainModule } from '@angular/ssr/node';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { join } from 'node:path';

// DI Container - imported to ensure initialization at startup
import { container } from './api/container';

// Token middlewares
import verifyAccessToken from './api/middlewares/verify-access-token.middleware';
import routes, { PUBLIC_AUTH_ROUTES } from './api/routes';

/**
 * Initialize Hono and export the app instance
 */
export const app = new Hono({ strict: false })
	.use(requestId())
	.use(
		'*',
		cors({
			origin: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
			credentials: true,
			allowHeaders: ['Content-Type', 'Authorization'],
			allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			maxAge: Number(process.env['CORS_MAX_AGE']) || 86400, // Cache preflight requests (default: 24 hours)
		}),
	)
	.use(secureHeaders());

/**
 * Apply authentication middleware to all API routes except public endpoints
 * Public endpoints: /api/auth/login, /api/auth/refresh, /api/auth/logout
 * Logout uses refresh token from cookie (no access token needed)
 * All other /api/* routes require valid (non-expired) authentication
 * IMPORTANT: This must be registered BEFORE routes for middleware to apply
 */
app.use('/api/*', async (c, next) => {
	const path = c.req.path;

	// Skip authentication for public paths
	if (PUBLIC_AUTH_ROUTES.some((p) => path.startsWith(p))) {
		return next();
	}

	// Apply authentication middleware for all other API routes
	return verifyAccessToken(c, next);
});

/**
 * Register routes used by the APIs
 */

for (const route of routes) {
	app.route(`/api${route.path}`, route.controller);
}

/**
 * Serve static files from /browser
 */
app.use(
	'*',
	serveStatic({
		root: join(import.meta.dirname, '../browser'),
		onFound: (path, c) => {
			c.header('Cache-Control', `public, immutable, max-age=31536000`);
		},
		onNotFound: () => {
			// Optionally log or handle the case where a static file is not found
		},
	}),
);

/**
 * Handle SSR for rest of the routes using Angular App Engine
 */
app.use('*', async (c, next) => {
	const angularApp = new AngularAppEngine();
	const response = await angularApp.handle(c.req.raw);
	if (response) {
		return response;
	}

	return next();
});

/**
 * Not found
 */
app.notFound((c) => {
	return c.text('404 - Not found', 404);
});

/**
 * Error handling
 */
app.onError((error, c) => {
	console.error(`${error}`);
	return c.text('Internal Server Error', 500);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment
 * variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
	// Verify DI container initialization before starting server
	try {
		container.cradle.pasetoService; // Triggers service instantiation
		console.log('DI Container initialized successfully');
	} catch (error) {
		console.error('DI Container initialization failed:', error);
		process.exit(1);
	}

	const port = Number(process.env['PORT'] || 4000);
	serve(
		{
			fetch: app.fetch,
			port,
		},
		(info) => {
			console.log(`Hono server listening on http://localhost:${info.port}`);
		},
	);
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build)
 * or Firebase Cloud Functions.
 */
export const reqHandler = createRequestHandler(app.fetch);
