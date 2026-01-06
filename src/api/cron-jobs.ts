import { AuthService } from './modules/auth/auth.service';

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Token cleanup cron job - removes expired refresh tokens
 */
function startTokenCleanupJob(): void {
	const authService = new AuthService();
	const DEFAULT_INTERVAL_MS = 86400000; // 24 hours
	const raw = Number(process.env['TOKEN_CLEANUP_INTERVAL_MS']);
	const intervalMs = isNaN(raw) || raw <= 0 ? DEFAULT_INTERVAL_MS : raw;
	console.log(`[CronJobs] Token cleanup scheduled every ${intervalMs / 1000}s`);

	// Run immediately, then at interval
	authService.cleanupExpiredTokens().catch(console.error);
	cleanupInterval = setInterval(() => authService.cleanupExpiredTokens().catch(console.error), intervalMs);
}

/**
 * Start all scheduled cron jobs.
 * Note: Skipped in serverless environments - use the API endpoint with scheduled triggers instead.
 */
export function startCronJobs(): void {
	// Skip cron jobs in serverless environments (SERVERLESS env var defaults to false)
	if (process.env['SERVERLESS'] === 'true') {
		console.log(
			'[CronJobs] Skipped - serverless environment. Use scheduled triggers with GET /api/auth/cleanup-tokens',
		);
		return;
	}

	startTokenCleanupJob();
}

/**
 * Stop all scheduled cron jobs.
 * Call this during graceful shutdown to prevent resource leaks.
 */
export function stopCronJobs(): void {
	if (cleanupInterval) {
		clearInterval(cleanupInterval);
		cleanupInterval = null;
		console.log('[CronJobs] Stopped token cleanup job');
	}
}
