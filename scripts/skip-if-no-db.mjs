/**
 * Exits with code 0 (skip) when PG_TEST_CONNECTION_STRING is not set.
 * Used by the test-integration target to avoid failures in environments without a database.
 */
if (!process.env.PG_TEST_CONNECTION_STRING) {
	console.log('[test-integration] Skipped — PG_TEST_CONNECTION_STRING not set')
	process.exit(0)
}
