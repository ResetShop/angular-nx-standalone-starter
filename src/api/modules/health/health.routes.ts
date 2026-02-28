import { createRoute, z } from '@hono/zod-openapi';

const healthCheckResponseSchema = z.object({
	status: z.enum(['healthy', 'unhealthy']),
	timestamp: z.string(),
	checks: z.object({
		database: z.union([
			z.object({
				status: z.literal('healthy'),
				responseTimeMs: z.number(),
			}),
			z.object({
				status: z.literal('unhealthy'),
				responseTimeMs: z.number().nullable(),
				error: z.string(),
			}),
		]),
	}),
});

export const healthCheckRoute = createRoute({
	method: 'get',
	path: '/v1',
	tags: ['Health'],
	summary: 'Health check',
	description: 'Returns application health status including database connectivity.',
	responses: {
		200: {
			description: 'Application is healthy',
			content: { 'application/json': { schema: healthCheckResponseSchema } },
		},
		503: {
			description: 'Application is unhealthy',
			content: { 'application/json': { schema: healthCheckResponseSchema } },
		},
	},
});
