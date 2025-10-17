export default {
	stories: ['../src/app/**/*.stories.mdx', '../src/app/**/*.stories.@(js|jsx|ts|tsx)'],
	styles: [],
	addons: [
		'@storybook/addon-docs',
		{
			name: '@storybook/addon-styling-webpack',
			options: {
				postCss: true,
			},
		},
	],
	framework: {
		name: '@storybook/angular',
		options: {
			enableIvy: true,
			enableProdMode: false,
		},
	},
	docs: {},
	staticDirs: [], //TODO: Add your project assets directory here, if needed
};

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/packages/storybook/documents/custom-builder-configs
