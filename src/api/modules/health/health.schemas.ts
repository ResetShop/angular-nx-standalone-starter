import { z } from 'zod';

/** Zod schema matching the HealthCheckResponse interface in interfaces.ts. */
export const healthCheckResponseSchema = z.object({
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
