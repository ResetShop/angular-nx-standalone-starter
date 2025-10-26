export default {
	displayName: 'app',
	testEnvironment: '@happy-dom/jest-environment',
	preset: './jest.preset.js',
	setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
	coverageDirectory: './coverage/app',
	transform: {
		'^.+\\.(ts|mjs|js|html)$': [
			'jest-preset-angular',
			{
				tsconfig: '<rootDir>/tsconfig.spec.json',
				stringifyContentPathRegex: '\\.(html|svg)$',
			},
		],
	},
	transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
	snapshotSerializers: [
		'jest-preset-angular/build/serializers/no-ng-attributes',
		'jest-preset-angular/build/serializers/ng-snapshot',
		'jest-preset-angular/build/serializers/html-comment',
	],
	testMatch: ['<rootDir>/src/**/__tests__/**/*.[jt]s?(x)', '<rootDir>/src/**/*(*.)@(spec|test).[jt]s?(x)'],
	moduleNameMapper: {
		'^@components/(.*)$': '<rootDir>/src/app/components/$1',
		'^@configs/(.*)$': '<rootDir>/src/app/configs/$1',
		'^@guards/(.*)$': '<rootDir>/src/app/guards/$1',
		'^@interfaces/(.*)$': '<rootDir>/src/app/interfaces/$1',
		'^@mocks/(.*)$': '<rootDir>/src/app/mocks/$1',
		'^@models/(.*)$': '<rootDir>/src/app/models/$1',
		'^@providers/(.*)$': '<rootDir>/src/app/providers/$1',
		'^@utils/(.*)$': '<rootDir>/src/app/utils/$1',
	},
};
