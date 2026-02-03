import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fn, resetTestCradle, setTestCradle } from './container.mock';
import { HealthStatus } from './modules/health/health.constants';
import type { HealthCheckResponse } from './modules/health/interfaces';
import { verifyDatabaseHealth } from './verify-database-health';

describe('verifyDatabaseHealth', () => {
	const mockCheckHealth = fn<[], Promise<HealthCheckResponse>>();

	beforeEach(() => {
		setTestCradle({
			healthService: { checkHealth: mockCheckHealth },
		});
	});

	afterEach(() => {
		resetTestCradle();
		mockCheckHealth.mockClear();
	});

	it('should resolve when health check returns healthy status', async () => {
		mockCheckHealth.mockResolvedValue({
			status: HealthStatus.HEALTHY,
			timestamp: new Date().toISOString(),
			checks: { database: { status: HealthStatus.HEALTHY, responseTimeMs: 5 } },
		});

		await expect(verifyDatabaseHealth()).resolves.toBeUndefined();
	});

	it('should throw when health check returns unhealthy status', async () => {
		mockCheckHealth.mockResolvedValue({
			status: HealthStatus.UNHEALTHY,
			timestamp: new Date().toISOString(),
			checks: { database: { status: HealthStatus.UNHEALTHY, responseTimeMs: null, error: 'Connection refused' } },
		});

		await expect(verifyDatabaseHealth()).rejects.toThrow('Database health check failed');
	});

	it('should log response time on success', async () => {
		const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined);

		mockCheckHealth.mockResolvedValue({
			status: HealthStatus.HEALTHY,
			timestamp: new Date().toISOString(),
			checks: { database: { status: HealthStatus.HEALTHY, responseTimeMs: 12 } },
		});

		await verifyDatabaseHealth();

		expect(consoleSpy).toHaveBeenCalledWith('Database health check passed (12ms)');
		consoleSpy.mockRestore();
	});

	it('should not log on failure', async () => {
		const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined);

		mockCheckHealth.mockResolvedValue({
			status: HealthStatus.UNHEALTHY,
			timestamp: new Date().toISOString(),
			checks: { database: { status: HealthStatus.UNHEALTHY, responseTimeMs: null, error: 'timeout' } },
		});

		await expect(verifyDatabaseHealth()).rejects.toThrow();
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
