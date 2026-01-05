import { AuthService } from './modules/auth/auth.service';

const authService = new AuthService();

/**
 * Token cleanup cron job - removes expired refresh tokens
 */
function startTokenCleanupJob(): void {
	const intervalMs = Number(process.env['TOKEN_CLEANUP_INTERVAL_MS']) || 3600000; // 1 hour default
	console.log(`[CronJobs] Token cleanup scheduled every ${intervalMs / 1000}s`);

	// Run immediately, then at interval
	authService.cleanupExpiredTokens().catch(console.error);
	setInterval(() => authService.cleanupExpiredTokens().catch(console.error), intervalMs);
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
