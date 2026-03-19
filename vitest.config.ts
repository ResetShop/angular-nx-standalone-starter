import angular from '@analogjs/vite-plugin-angular'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [angular(), nxViteTsPaths()],
	test: {
		globals: true,
		environment: 'happy-dom',
		reporters: ['verbose'],
		setupFiles: ['src/test-setup.ts'],
		include: ['src/**/*.{test,spec}.ts', 'tools/**/*.spec.js'],
		exclude: ['node_modules', 'dist', '.nx', 'coverage', '**/node_modules/**', '**/dist/**', 'src/api/integration/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			reportsDirectory: './coverage/app',
			exclude: [
				'node_modules/',
				'src/test-setup.ts',
				'**/*.spec.ts',
				'**/*.test.ts',
				'**/*.stories.ts',
				'**/mocks/**',
				'**/*.config.ts',
				'**/main.ts',
				'**/main.server.ts',
				'**/server.ts',
			],
		},
	},
	server: {
		fs: {
			allow: ['.'],
		},
	},
	optimizeDeps: {
		exclude: ['dist'],
	},
	resolve: {
		alias: {
			'@contracts': '/src/contracts',
			'@components': '/src/app/components',
			'@configs': '/src/app/configs',
			'@constants': '/src/app/constants',
			'@domain': '/src/app/domain',
			'@guards': '/src/app/guards',
			'@interfaces': '/src/app/interfaces',
			'@mocks': '/src/app/mocks',
			'@models': '/src/app/models',
			'@pages': '/src/app/pages',
			'@providers': '/src/app/providers',
			'@store': '/src/app/store',
			'@utils': '/src/utils',
			'@test-utils': '/src/test-utils',
		},
	},
})
