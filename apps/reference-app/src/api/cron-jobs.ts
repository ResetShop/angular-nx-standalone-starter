import { isServerless } from '@resetshop/hono-core'
import { parseDurationToMs } from '@resetshop/util'
import { MIN_CRON_SECRET_LENGTH } from './constants/auth.constants'
import { container } from './container/container'

let cleanupInterval: NodeJS.Timeout | null = null

/**
 * Validate CRON_SECRET at startup and log warning if too short.
 * Only logs once to avoid spam.
 */
function validateCronSecret(): void {
	const cronSecret = process.env['CRON_SECRET']
	if (cronSecret && cronSecret.length < MIN_CRON_SECRET_LENGTH) {
		console.warn(
			`[CronJobs] WARNING: CRON_SECRET is too short (${cronSecret.length} chars). Minimum ${MIN_CRON_SECRET_LENGTH} characters required for secure authentication.`,
		)
	}
}

/**
 * Token cleanup cron job - removes expired refresh tokens
 */
function startTokenCleanupJob(): void {
	try {
		const minInterval = '1m'
		const maxInterval = '7d'
		const defaultInterval = '24h'

		const envValue = process.env['TOKEN_CLEANUP_INTERVAL_MS']
		const parsedEnvInterval = parseInt(envValue ?? '', 10)

		const { tokenMaintenanceService } = container.cradle
		const isValidInterval =
			Number.isFinite(parsedEnvInterval) &&
			parsedEnvInterval >= parseDurationToMs(minInterval) &&
			parsedEnvInterval <= parseDurationToMs(maxInterval)

		if (envValue && !isValidInterval) {
			console.warn(
				`[CronJobs] WARNING: TOKEN_CLEANUP_INTERVAL_MS="${envValue}" is invalid. ` +
					`Must be a number between ${parseDurationToMs(minInterval)} and ${parseDurationToMs(maxInterval)}. ` +
					`Using default: ${parseDurationToMs(defaultInterval)}ms`,
			)
		}

		const intervalMs = isValidInterval ? parsedEnvInterval : parseDurationToMs(defaultInterval)
		console.log(`[CronJobs] Token cleanup scheduled every ${intervalMs / 1000}s`)

		// Run immediately, then at interval
		tokenMaintenanceService.cleanupExpiredTokens().catch(console.error)
		cleanupInterval = setInterval(() => tokenMaintenanceService.cleanupExpiredTokens().catch(console.error), intervalMs)
	} catch (error) {
		console.error('[CronJobs] Failed to start token cleanup job:', error)
		// Don't crash the server - cron jobs are not critical for basic operation
		// The cleanup endpoint remains available as a fallback
	}
}

/**
 * Start all scheduled cron jobs.
 * Note: Skipped in serverless environments - use the API endpoint with scheduled triggers instead.
 */
export function startCronJobs(): void {
	// Validate CRON_SECRET once at startup
	validateCronSecret()

	// Skip cron jobs in serverless environments
	if (isServerless()) {
		console.log('[CronJobs] Skipped - serverless environment. Use scheduled triggers with GET /api/auth/cleanup-tokens')
		return
	}

	startTokenCleanupJob()
}

/**
 * Stop all scheduled cron jobs.
 * Call this during graceful shutdown to prevent resource leaks.
 */
export function stopCronJobs(): void {
	if (cleanupInterval) {
		clearInterval(cleanupInterval)
		cleanupInterval = null
		console.log('[CronJobs] Stopped token cleanup job')
	}
}
