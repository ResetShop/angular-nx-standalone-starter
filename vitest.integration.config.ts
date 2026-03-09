import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [nxViteTsPaths()],
	test: {
		globals: true,
		environment: 'node',
		reporters: ['verbose'],
		globalSetup: ['src/api/integration/setup/global-setup.ts'],
		setupFiles: ['src/api/integration/setup/integration-setup.ts'],
		include: ['src/api/integration/**/*.integration.spec.ts'],
		exclude: ['node_modules', 'dist', '.nx', 'coverage'],
		testTimeout: 30_000,
		fileParallelism: false,
	},
	resolve: {
		alias: {
			'@contracts': '/src/contracts',
			'@components': '/src/app/components',
			'@configs': '/src/app/configs',
			'@domain': '/src/app/domain',
			'@guards': '/src/app/guards',
			'@interfaces': '/src/app/interfaces',
			'@mocks': '/src/app/mocks',
			'@models': '/src/app/models',
			'@pages': '/src/app/pages',
			'@providers': '/src/app/providers',
			'@store': '/src/app/store',
			'@utils': '/src/app/utils',
			'@test-utils': '/src/test-utils',
		},
	},
});
