export const HealthStatus = Object.freeze({
	HEALTHY: 'healthy',
	UNHEALTHY: 'unhealthy',
} as const);

export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export const HEALTH_CHECK_TIMEOUT_MS = 5000;
