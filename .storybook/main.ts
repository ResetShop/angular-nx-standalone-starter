import type { StorybookConfig } from '@storybook/angular'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/reference-app')

const config: StorybookConfig = {
	stories: [
		'../apps/reference-app/src/app/**/*.stories.mdx',
		'../apps/reference-app/src/app/**/*.stories.@(js|jsx|ts|tsx)',
	],
	addons: [
		getAbsolutePath('@storybook/addon-docs'),
		{
			name: getAbsolutePath('@storybook/addon-styling-webpack'),
			options: {
				postCss: true,
			},
		},
	],
	framework: {
		name: getAbsolutePath('@storybook/angular'),
		options: {
			enableIvy: true,
			enableProdMode: false,
		},
	},
	docs: {},
	webpackFinal: async (config) => {
		if (config.resolve) {
			config.resolve.alias = {
				...config.resolve.alias,
				'@components': resolve(appRoot, 'src/app/components'),
				'@configs': resolve(appRoot, 'src/app/configs'),
				'@contracts': resolve(appRoot, 'src/contracts'),
				'@directives': resolve(appRoot, 'src/app/directives'),
				'@domain': resolve(appRoot, 'src/app/domain'),
				'@guards': resolve(appRoot, 'src/app/guards'),
				'@interfaces': resolve(appRoot, 'src/app/interfaces'),
				'@mocks': resolve(appRoot, 'src/app/mocks'),
				'@pages': resolve(appRoot, 'src/app/pages'),
				'@providers': resolve(appRoot, 'src/app/providers'),
				'@schema': resolve(appRoot, 'src/db/schema'),
				'@store': resolve(appRoot, 'src/app/store'),
			}
		}
		return config
	},
}

export default config

function getAbsolutePath(value: string): string {
	return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}
