import { Hono } from 'hono';
import { container } from '../../container';
import { HealthStatus } from './health.constants';
import type { HealthCheckResponse } from './interfaces';

const app = new Hono();

/**
 * Health check endpoint
 * GET /api/health/v1
 *
 * Returns application health status including database connectivity.
 * Responds with 200 when healthy, 503 when unhealthy.
 */
app.get('/v1', async (c) => {
	const { healthService } = container.cradle;
	const health = await healthService.checkHealth();
	const statusCode = health.status === HealthStatus.HEALTHY ? 200 : 503;
	return c.json<HealthCheckResponse>(health, statusCode);
});

export default app;
