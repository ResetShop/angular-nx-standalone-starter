import { container } from '../../container';
import { HealthStatus } from './health.constants';

/**
 * Verifies database connectivity by running a health check probe.
 * Logs a human-readable summary on success.
 * @throws {Error} if the database is unreachable.
 */
export async function verifyDatabaseHealth(): Promise<void> {
	const healthService = container.resolve('healthService');
	const result = await healthService.checkHealth();

	if (result.status === HealthStatus.UNHEALTHY) {
		throw new Error('Database health check failed');
	}

	// REASON: Startup diagnostic — confirms database connectivity before accepting traffic
	console.log(`Database health check passed (${result.checks.database.responseTimeMs}ms)`);
}
