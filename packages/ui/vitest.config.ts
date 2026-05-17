import angular from '@analogjs/vite-plugin-angular'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	root: __dirname,
	plugins: [angular(), nxViteTsPaths()],
	test: {
		globals: true,
		environment: 'happy-dom',
		reporters: ['verbose'],
		include: ['src/**/*.{test,spec}.ts', 'eslint/**/*.spec.{js,ts}'],
		exclude: ['node_modules', 'dist'],
		setupFiles: ['src/test-setup.ts'],
	},
})
