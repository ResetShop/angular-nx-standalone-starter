import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [nxViteTsPaths()],
	resolve: {
		alias: {
			'@contracts': 'apps/reference-app/src/contracts',
			'@schema': 'apps/reference-app/src/db/schema',
		},
	},
	test: {
		globals: true,
		environment: 'node',
		reporters: ['verbose'],
		setupFiles: ['apps/reference-app/src/api/integration/setup/integration-setup.ts'],
		include: ['apps/reference-app/src/api/integration/**/*.integration.spec.ts'],
		exclude: ['node_modules', 'dist', '.nx', 'coverage'],
		testTimeout: 30_000,
		// PGlite is in-process and cannot cross worker boundaries; pin to one
		// worker so all integration tests share a single PGlite instance and
		// one schema-push + seed cycle. `fileParallelism: false` ensures
		// serial file execution; `maxWorkers: 1` ensures only one worker
		// process exists for the run; `isolate: false` keeps the module cache
		// shared across files. The legacy cross-process `globalSetup` model
		// was removed in #321 — schema push and seed live in
		// `integration-setup.ts` and run once at module load.
		fileParallelism: false,
		maxWorkers: 1,
		isolate: false,
	},
})
