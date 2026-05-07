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
		// Tests share state across files (seeded admin user, restricted user,
		// admin role) and are not designed for parallel execution against a
		// shared DB. Pin to a single worker — the win from real Postgres is
		// pool semantics + CI fidelity, not parallel test execution.
		fileParallelism: false,
		maxWorkers: 1,
	},
})
