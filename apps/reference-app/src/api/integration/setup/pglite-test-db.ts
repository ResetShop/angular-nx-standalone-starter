/**
 * Single-instance PGlite owner for the integration-test path.
 *
 * PGlite is real Postgres compiled to WebAssembly — runs in-process, no
 * Docker daemon required.
 *
 * The instance lives on `globalThis` rather than module scope. Vitest 4
 * re-evaluates `setupFiles` for each test file even with `isolate: false`
 * + `maxWorkers: 1` + `fileParallelism: false` (the integration config has
 * all three set), so module-scoped `let` would be reset per file. Using
 * `globalThis` shares the singleton across all module evaluations within
 * the same Node process — which is what we want for a single-PGlite suite.
 */
import { PGlite } from '@electric-sql/pglite'
import { schema } from '@schema/all'
import { drizzle } from 'drizzle-orm/pglite'

declare global {
	// eslint-disable-next-line no-var -- globalThis augmentation requires `var`
	var __pgliteInstance: PGlite | undefined
	// eslint-disable-next-line no-var -- globalThis augmentation requires `var`
	var __pgliteDb: ReturnType<typeof drizzle<typeof schema>> | undefined
}

export function getPgliteTestDb(): NonNullable<typeof globalThis.__pgliteDb> {
	if (!globalThis.__pgliteDb) {
		globalThis.__pgliteInstance = new PGlite()
		globalThis.__pgliteDb = drizzle(globalThis.__pgliteInstance, { schema })
	}
	return globalThis.__pgliteDb
}

export async function closePgliteTestDb(): Promise<void> {
	if (globalThis.__pgliteInstance) {
		await globalThis.__pgliteInstance.close()
	}
	globalThis.__pgliteInstance = undefined
	globalThis.__pgliteDb = undefined
}
