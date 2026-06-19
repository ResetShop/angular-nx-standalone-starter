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
		globalSetup: ['apps/reference-app/src/api/integration/setup/global-setup.ts'],
		setupFiles: ['apps/reference-app/src/api/integration/setup/integration-setup.ts'],
		include: ['apps/reference-app/src/api/integration/**/*.integration.spec.ts'],
		exclude: ['node_modules', 'dist', '.nx', 'coverage'],
		testTimeout: 30_000,
		// Give the worker's afterAll (which drains both DB pools) room to finish before
		// Vitest force-exits, so the worker can shut down its sockets cleanly.
		teardownTimeout: 30_000,
		fileParallelism: false,
	},
})
