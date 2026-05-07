/**
 * Spawns a real Postgres 17 cluster locally via the `embedded-postgres`
 * package (official EnterpriseDB binaries, downloaded once at install time).
 * Used by `global-setup.ts` to provide a no-Docker test DB when
 * `PG_TEST_CONNECTION_STRING` is not set. Skipped on CI, where the workflow
 * already publishes a connection string pointing at the `postgres:17`
 * service container.
 */
import EmbeddedPostgres from 'embedded-postgres'
import { mkdtempSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const TEST_DB_NAME = 'test_db'
const PG_USER = 'postgres'
const PG_PASSWORD = 'postgres'

let pg: EmbeddedPostgres | undefined

async function getFreePort(): Promise<number> {
	return new Promise<number>((resolve, reject) => {
		const srv = createServer()
		srv.unref()
		srv.on('error', reject)
		srv.listen(0, () => {
			const address = srv.address()
			if (address && typeof address === 'object') {
				const { port } = address
				srv.close(() => resolve(port))
			} else {
				srv.close(() => reject(new Error('Failed to acquire free port')))
			}
		})
	})
}

export async function startEmbeddedPostgres(): Promise<string> {
	const port = await getFreePort()
	const databaseDir = mkdtempSync(join(tmpdir(), 'rs-integration-pg-'))

	pg = new EmbeddedPostgres({
		databaseDir,
		port,
		user: PG_USER,
		password: PG_PASSWORD,
		persistent: false,
		onLog: () => undefined,
		onError: (err) => console.error('[embedded-pg]', err),
	})

	await pg.initialise()
	await pg.start()
	await pg.createDatabase(TEST_DB_NAME)

	return `postgres://${PG_USER}:${PG_PASSWORD}@localhost:${port}/${TEST_DB_NAME}`
}

export async function stopEmbeddedPostgres(): Promise<void> {
	if (!pg) return
	await pg.stop()
	pg = undefined
}
