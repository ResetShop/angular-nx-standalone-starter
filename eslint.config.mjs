import nx from '@nx/eslint-plugin'
import stylisticJs from '@stylistic/eslint-plugin'
import vitest from '@vitest/eslint-plugin'
import noBarrelFiles from 'eslint-plugin-no-barrel-files'
import playwright from 'eslint-plugin-playwright'
import storybook from 'eslint-plugin-storybook'
import testingLibrary from 'eslint-plugin-testing-library'
import requireEnvironmentProviders from './packages/angular-core/eslint/require-environment-providers.js'
import formFieldAllowedContent from './packages/ui/eslint/form-field-allowed-content.js'
import storybookSourceState from './packages/ui/eslint/storybook-source-state.js'

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

// Forbids direct `process.env` access — the single selector matches the `process.env`
// MemberExpression itself, which is the inner node in every access form: `process.env.X`,
// `process.env['X']`, and bare `process.env` (e.g. passed as an argument). Allowlisted in the
// `no-process-env-allowlist` config below for the env sub-schema factory and the test/integration
// setup files that legitimately read process.env.
const processEnvRestrictedSyntax = [
	{
		selector: "MemberExpression[object.name='process'][property.name='env']",
		message:
			"Direct process.env access is forbidden. Import the typed value from '@config/<domain>.env' (e.g. dbEnv.PG_CONNECTION_STRING, authEnv.PASETO_SECRET_KEY). The allowlist lives in eslint.config.mjs.",
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
		name: 'module-boundaries',
		files: ['**/*.ts'],
		rules: {
			'@nx/enforce-module-boundaries': [
				'error',
				{
					enforceBuildableLibDependency: true,
					allow: [],
					depConstraints: [
						// Scope constraints — fork-distribution model.
						// scope:starter projects (packages/*, apps/reference-app) may
						// only depend on other scope:starter projects. They never reach
						// into a fork's app code.
						//
						// Note: this constraint is fork-side enforcement. In the upstream
						// repo no scope:app project exists, so the rule will only fire
						// against violations once a fork generates an app. The CI guards
						// from Steps 6 and 7 catch the upstream side of the contract.
						{
							sourceTag: 'scope:starter',
							onlyDependOnLibsWithTags: ['scope:starter'],
						},
						// scope:app projects (fork-generated apps) may depend on both
						// scope:starter (the canonical building blocks) and other
						// scope:app projects in the same fork.
						//
						// Generated apps must carry BOTH `type:app` AND `scope:app` tags
						// for both enforcement layers to apply — the schematic in
						// `@resetshop/generators:app` emits both automatically.
						{
							sourceTag: 'scope:app',
							onlyDependOnLibsWithTags: ['scope:starter', 'scope:app'],
						},
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
			'no-restricted-syntax': [
				'error',
				...commonRestrictedSyntax,
				...viRestrictedSyntax,
				...processEnvRestrictedSyntax,
			],
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
		// process.env allowlist — the only files that may read process.env directly:
		//   - api/config/** : the env sub-schemas and the createEnvHandler factory (env-utils.ts),
		//     which parse process.env once per domain behind the lazy proxy, plus their specs.
		//   - test-setup.ts : pre-seeds env values before any production module loads.
		//   - api/integration/** : integration setup helpers and specs that drive test fixtures via env.
		//   - db/** : entry-point scripts (e.g. seed.ts) that read CI/TTY signals before the app boots.
		// These keep the common + vi restrictions; only the process.env restriction is lifted.
		name: 'no-process-env-allowlist',
		files: [
			'apps/**/src/api/config/**/*.ts',
			'apps/**/src/test-setup.ts',
			'apps/**/src/api/integration/**/*.ts',
			'apps/**/src/db/**/*.ts',
		],
		rules: {
			'no-restricted-syntax': ['error', ...commonRestrictedSyntax, ...viRestrictedSyntax],
		},
	},
	{
		name: 'barrel-exception',
		files: ['packages/*/src/index.ts'],
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
		// Spec files are intentionally NOT excluded — even tests must respect
		// the package/app boundary, otherwise a spec under apps/ could reach
		// into packages/ internals via a relative path and create an
		// undocumented coupling that the regular boundary rules don't catch.
		//
		// Note on the regex below: TypeScript import specifiers always use
		// forward-slash separators, so the `^(\.\./)+packages/` pattern matches
		// every nesting depth without having to handle Windows backslash variants.
		name: 'no-cross-boundary-relative-imports-from-packages',
		files: ['packages/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							// Matches any number of `../` segments leading into apps/.
							regex: '^(\\.\\./)+apps/',
							message:
								'packages/* must never import from apps/*. The fork-distribution model requires starter code to be self-contained.',
						},
					],
				},
			],
		},
	},
	{
		// Applies to all apps including apps/reference-app — starter code must
		// also use package aliases, not relative paths into packages/.
		name: 'no-cross-boundary-relative-imports-from-apps',
		files: ['apps/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							// Matches any number of `../` segments leading into packages/.
							regex: '^(\\.\\./)+packages/',
							message:
								'Use the package alias (e.g. `@<scope>/ui`) instead of a relative path into packages/*. This keeps fork apps decoupled from the starter directory layout.',
						},
					],
				},
			],
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
		name: 'storybook-source-state',
		files: ['**/*.stories.ts'],
		plugins: {
			'custom-storybook': {
				rules: {
					'storybook-source-state': storybookSourceState,
				},
			},
		},
		rules: {
			'custom-storybook/storybook-source-state': 'error',
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
