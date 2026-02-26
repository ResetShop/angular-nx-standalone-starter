import type { Cradle } from './container.types';

/**
 * Type that allows partial implementations of each service in the Cradle.
 * Useful for tests where you only need to mock specific methods.
 */
type MockCradle = {
	[K in keyof Cradle]?: Partial<Cradle[K]>;
};

/**
 * Test cradle holder for swapping container dependencies in tests.
 * This allows tests to provide mock services without using vi.mock.
 *
 * Usage in tests:
 * ```typescript
 * import { setTestCradle, resetTestCradle } from '../../container/container.mock';
 *
 * beforeEach(() => {
 *   setTestCradle({
 *     roleService: {
 *       getAllRoles: mockGetAllRoles,
 *       getRole: mockGetRole,
 *     },
 *   });
 * });
 *
 * afterEach(() => {
 *   resetTestCradle();
 * });
 * ```
 */
let testCradle: MockCradle | null = null;

/**
 * Set mock services for tests. Only the services you provide will be mocked;
 * accessing unmocked services will throw an error to catch missing mocks early.
 * You can provide partial implementations - only mock the methods you need.
 */
export function setTestCradle(cradle: MockCradle): void {
	testCradle = cradle;
}

/**
 * Reset the test cradle. Call this in afterEach to ensure clean state.
 */
export function resetTestCradle(): void {
	testCradle = null;
}

/**
 * Get the current test cradle, or null if not in test mode.
 * Used internally by the container proxy.
 */
export function getTestCradle(): MockCradle | null {
	return testCradle;
}

/**
 * Check if we're in test mode (test cradle is set).
 */
export function isTestMode(): boolean {
	return testCradle !== null;
}

/**
 * Type-safe mock builder for creating partial cradle objects.
 * Provides better IDE support when creating mocks.
 */
export function createMockCradle(mocks: MockCradle): MockCradle {
	return mocks;
}
