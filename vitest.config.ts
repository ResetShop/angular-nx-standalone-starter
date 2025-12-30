/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [angular(), nxViteTsPaths()],
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['src/test-setup.ts'],
		include: ['src/**/*.{test,spec}.ts'],
		exclude: ['node_modules', 'dist', '.nx', 'coverage', '**/node_modules/**', '**/dist/**'],
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
			'@components': '/src/app/components',
			'@configs': '/src/app/configs',
			'@guards': '/src/app/guards',
			'@interfaces': '/src/app/interfaces',
			'@mocks': '/src/app/mocks',
			'@models': '/src/app/models',
			'@providers': '/src/app/providers',
			'@utils': '/src/app/utils',
		},
	},
});
