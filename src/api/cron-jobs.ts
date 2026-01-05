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
 * Note: Skipped on Vercel (serverless) - use Vercel Cron Jobs with the API endpoint instead.
 */
export function startCronJobs(): void {
	// Skip cron jobs on Vercel (serverless environment)
	if (process.env['VERCEL']) {
		console.log('[CronJobs] Skipped - running on Vercel. Use Vercel Cron Jobs with GET /api/auth/cleanup-tokens');
		return;
	}

	startTokenCleanupJob();
}
