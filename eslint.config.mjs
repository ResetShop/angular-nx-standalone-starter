import nx from '@nx/eslint-plugin'
import stylisticJs from '@stylistic/eslint-plugin'
import vitest from '@vitest/eslint-plugin'
import noBarrelFiles from 'eslint-plugin-no-barrel-files'
import playwright from 'eslint-plugin-playwright'
import storybook from 'eslint-plugin-storybook'
import testingLibrary from 'eslint-plugin-testing-library'
import requireEnvironmentProviders from './packages/angular-core/eslint/require-environment-providers.js'
import formFieldAllowedContent from './packages/ui/eslint/form-field-allowed-content.js'

const commonRestrictedSyntax = [
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
]

const viRestrictedSyntax = [
	// Mocking
	{
		selector: 'CallExpression[callee.object.name="vi"][callee.property.name="mock"]',
		message: 'vi.mock() is forbidden. Use dependency injection and mock classes instead.',
	},
	{
		selector: 'CallExpression[callee.object.name="vi"][callee.property.name="fn"]',
		message: 'vi.fn() is forbidden. Use fn() from test-utils.ts instead.',
	},
	// Timers
	{
		selector: 'CallExpression[callee.object.name="vi"][callee.property.name="useFakeTimers"]',
		message: 'vi.useFakeTimers() is forbidden. Use useFakeTimers() from test-utils.ts instead.',
	},
	{
		selector: 'CallExpression[callee.object.name="vi"][callee.property.name="advanceTimersByTime"]',
		message: 'vi.advanceTimersByTime() is forbidden. Use advanceTimersByTime() from test-utils.ts instead.',
	},
	{
		selector: 'CallExpression[callee.object.name="vi"][callee.property.name="useRealTimers"]',
		message: 'vi.useRealTimers() is forbidden. Use useRealTimers() from test-utils.ts instead.',
	},
	// Bulk operations
	{
		selector: 'CallExpression[callee.object.name="vi"][callee.property.name="clearAllMocks"]',
		message: 'vi.clearAllMocks() is forbidden. Use clearAllMocks() from test-utils.ts instead.',
	},
	// Spying
	{
		selector: 'CallExpression[callee.object.name="vi"][callee.property.name="spyOn"]',
		message: 'vi.spyOn() is forbidden. Use spyOn() from test-utils.ts instead.',
	},
	// Type casting
	{
		selector: 'CallExpression[callee.object.name="vi"][callee.property.name="mocked"]',
		message: 'vi.mocked() is forbidden. Cast the auto-mocked function directly using Mock type.',
	},
]

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
		// Tags are inactive until packages/* and libs/* projects are created
		// (Epic 1, PRs 1.2 onward). The rule fires zero findings today
		// because no project carries any `type:*` tag yet — the constraints
		// will start enforcing naturally as projects are scaffolded.
		name: 'module-boundaries',
		files: ['**/*.ts'],
		rules: {
			'@nx/enforce-module-boundaries': [
				'error',
				{
					enforceBuildableLibDependency: true,
					allow: [],
					depConstraints: [
						{
							sourceTag: 'type:app',
							onlyDependOnLibsWithTags: [
								'type:app',
								'type:ui',
								'type:angular-core',
								'type:hono-core',
								'type:data-access',
								'type:backend',
								'type:contracts',
								'type:util',
							],
						},
						{
							sourceTag: 'type:ui',
							onlyDependOnLibsWithTags: ['type:ui', 'type:angular-core', 'type:util'],
						},
						{
							sourceTag: 'type:angular-core',
							onlyDependOnLibsWithTags: ['type:angular-core', 'type:util'],
						},
						{
							sourceTag: 'type:hono-core',
							onlyDependOnLibsWithTags: ['type:hono-core', 'type:util'],
						},
						{
							sourceTag: 'type:data-access',
							onlyDependOnLibsWithTags: ['type:data-access', 'type:angular-core', 'type:contracts', 'type:util'],
						},
						{
							sourceTag: 'type:backend',
							onlyDependOnLibsWithTags: ['type:backend', 'type:hono-core', 'type:contracts', 'type:util'],
						},
						{
							sourceTag: 'type:contracts',
							onlyDependOnLibsWithTags: ['type:contracts'],
						},
						{
							sourceTag: 'type:util',
							onlyDependOnLibsWithTags: ['type:util'],
						},
					],
				},
			],
		},
	},
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
			'vitest/prefer-to-have-length': 'error',
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
			'@typescript-eslint/explicit-member-accessibility': [
				'error',
				{
					accessibility: 'explicit',
					overrides: {
						constructors: 'no-public',
					},
				},
			],
			'@typescript-eslint/no-inferrable-types': 0,
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/no-non-null-assertion': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-require-imports': 'error',
			'no-restricted-syntax': ['error', ...commonRestrictedSyntax, ...viRestrictedSyntax],
			'@stylistic/js/no-extra-semi': 'off',
			'vitest/no-focused-tests': 'error',
			'no-barrel-files/no-barrel-files': 'error',
			'preserve-caught-error': 'error',
		},
	},
	{
		name: 'test-utils',
		files: ['src/test-utils.ts', 'packages/util/src/lib/test-utils.ts'],
		rules: {
			'no-restricted-syntax': ['error', ...commonRestrictedSyntax],
		},
	},
	{
		// Two-tree intent: packages/ holds Nx-scaffolded `@resetshop/*`
		// reusable packages, while libs/ holds the manually managed `@libs/*`
		// app-domain libraries (libs/contracts, libs/data-access, libs/backend).
		// Both legitimately need a single barrel index.ts as their public API,
		// so the no-barrel-files rule is exempted for those entry points only.
		name: 'barrel-exception',
		files: ['packages/*/src/index.ts', 'libs/*/src/index.ts'],
		rules: {
			'no-barrel-files/no-barrel-files': 'off',
		},
	},
	{
		name: 'html',
		files: ['**/*.html'],
		plugins: {
			'custom-template': {
				rules: {
					'form-field-allowed-content': formFieldAllowedContent,
				},
			},
		},
		rules: {
			'@angular-eslint/template/prefer-control-flow': 'error',
			'@angular-eslint/template/prefer-self-closing-tags': 'error',
			'@angular-eslint/template/prefer-ngsrc': 'error',
			'custom-template/form-field-allowed-content': 'error',
		},
	},
	{
		name: 'no-direct-api-injection',
		files: ['src/app/pages/**/*.ts', 'src/app/components/**/*.ts'],
		ignores: ['**/*.spec.ts', '**/*.test.ts', '**/*.stories.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: '@providers/auth/auth.interface',
							message: 'Inject AuthApi via stores or guards, not directly in components.',
						},
						{
							name: '@providers/users/users.interface',
							message: 'Inject UsersApi via stores, not directly in components.',
						},
						{
							name: '@providers/roles/roles.interface',
							message: 'Inject RolesApi via stores, not directly in components.',
						},
						{
							name: '@providers/permissions/permissions.interface',
							message: 'Inject PermissionsApi via stores, not directly in components.',
						},
					],
				},
			],
		},
	},
	{
		name: 'require-environment-providers',
		files: ['src/app/providers/**/*.provider.ts', 'src/app/providers/**/*.mock.ts'],
		plugins: {
			'custom-providers': {
				rules: {
					'require-environment-providers': requireEnvironmentProviders,
				},
			},
		},
		rules: {
			'custom-providers/require-environment-providers': 'error',
		},
	},
	{
		files: ['**/*.ts', '**/*.js'],
		// Override or add rules here
		rules: {},
	},
]
