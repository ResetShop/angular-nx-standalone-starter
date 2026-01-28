import nx from '@nx/eslint-plugin';
import stylisticJs from '@stylistic/eslint-plugin';
import noBarrelFiles from 'eslint-plugin-no-barrel-files';
import playwright from 'eslint-plugin-playwright';
import storybook from 'eslint-plugin-storybook';
import testingLibrary from 'eslint-plugin-testing-library';
import vitest from 'eslint-plugin-vitest';

export default [
	{
		name: 'ignores',
		ignores: ['!**/*', '.nx', 'dist'],
	},
	...nx.configs['flat/base'],
	...nx.configs['flat/typescript'],
	...nx.configs['flat/javascript'],
	...storybook.configs['flat/recommended'],
	...nx.configs['flat/angular'],
	...nx.configs['flat/angular-template'],
	{
		name: 'testing',
		files: ['**/src/**/?(*.)+(spec|test).ts'],
		plugins: {
			vitest,
			'testing-library': testingLibrary,
		},
		rules: {
			...testingLibrary.configs['flat/angular'].rules,
			...vitest.configs.recommended.rules,
			'vitest/expect-expect': 'off',
		},
	},
	{
		name: 'playwright',
		files: ['**/e2e/**/?(*.)+(spec|test).ts'],
		plugins: {
			playwright,
		},
		rules: {
			...playwright.configs['flat/recommended'],
		},
	},
	{
		name: 'nx',
		files: ['**/*.ts'],
		plugins: {
			'@stylistic/js': stylisticJs,
			vitest,
			'no-barrel-files': noBarrelFiles,
		},
		rules: {
			'@angular-eslint/directive-selector': [
				'error',
				{
					type: 'attribute',
					prefix: 'app',
					style: 'camelCase',
				},
			],
			'@angular-eslint/component-selector': [
				'error',
				{
					type: 'element',
					prefix: 'app',
					style: 'kebab-case',
				},
			],
			'@angular-eslint/prefer-signals': 'error',
			'@typescript-eslint/no-inferrable-types': 0,
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/no-non-null-assertion': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-require-imports': 'error',
			'no-restricted-syntax': [
				'error',
				{
					selector: 'MemberExpression[object.name="module"][property.name="exports"]',
					message: 'Use ES modules (export) instead of CommonJS (module.exports)',
				},
				{
					selector: 'MemberExpression[object.name="exports"]',
					message: 'Use ES modules (export) instead of CommonJS (exports)',
				},
				{
					selector: 'TSEnumDeclaration',
					message: 'Enums are forbidden. Use Object.freeze() instead for key/value references',
				},
				{
					selector: 'TSClassImplements > Identifier[name="OnInit"]',
					message: 'OnInit is forbidden. Use constructor initialization and signals instead.',
				},
				{
					selector: 'TSClassImplements > Identifier[name="OnChanges"]',
					message: 'OnChanges is forbidden. Use computed() or effect() to react to input changes.',
				},
				{
					selector: 'TSClassImplements > Identifier[name="DoCheck"]',
					message: 'DoCheck is forbidden. Use computed() or effect() instead.',
				},
				{
					selector: 'TSClassImplements > Identifier[name="AfterContentInit"]',
					message: 'AfterContentInit is forbidden. Use contentChild() signals and effect() instead.',
				},
				{
					selector: 'TSClassImplements > Identifier[name="AfterContentChecked"]',
					message: 'AfterContentChecked is forbidden. Use computed() or effect() instead.',
				},
				{
					selector: 'TSClassImplements > Identifier[name="AfterViewInit"]',
					message: 'AfterViewInit is forbidden. Use viewChild() signals and effect() instead.',
				},
				{
					selector: 'TSClassImplements > Identifier[name="AfterViewChecked"]',
					message: 'AfterViewChecked is forbidden. Use computed() or effect() instead.',
				},
				{
					selector: 'PropertyDefinition[static=true]',
					message: 'Static properties are forbidden. Use a singleton service with providedIn: root instead.',
				},
			],
			'@stylistic/js/no-extra-semi': 'off',
			'vitest/no-focused-tests': 'error',
			'no-barrel-files/no-barrel-files': 'error',
			'preserve-caught-error': 'error',
		},
	},
	{
		name: 'html',
		files: ['**/*.html'],
		rules: {
			'@angular-eslint/template/prefer-control-flow': 'error',
			'@angular-eslint/template/prefer-self-closing-tags': 'error',
			'@angular-eslint/template/prefer-ngsrc': 'error',
		},
	},
	{
		files: ['**/*.ts', '**/*.js'],
		// Override or add rules here
		rules: {},
	},
];
