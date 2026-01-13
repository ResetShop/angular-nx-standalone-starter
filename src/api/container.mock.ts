import type { Cradle } from './container';

/**
 * Type that allows partial implementations of each service in the Cradle.
 * Useful for tests where you only need to mock specific methods.
 */
export type MockCradle = {
	[K in keyof Cradle]?: Partial<Cradle[K]>;
};

/**
 * Mock function interface - provides call tracking and return value control.
 * Alternative to vi.fn() that doesn't depend on Vitest.
 */
export interface MockFn<TArgs extends unknown[] = unknown[], TReturn = unknown> {
	(...args: TArgs): TReturn;
	/** All recorded calls to this mock function */
	calls: TArgs[];
	/** Set a resolved promise as the return value */
	mockResolvedValue: (value: Awaited<TReturn>) => MockFn<TArgs, TReturn>;
	/** Set a rejected promise as the return value */
	mockRejectedValue: (error: unknown) => MockFn<TArgs, TReturn>;
	/** Set a direct return value */
	mockReturnValue: (value: TReturn) => MockFn<TArgs, TReturn>;
	/** Clear all recorded calls */
	mockClear: () => void;
}

/** Registry of all created mock functions for bulk operations */
const mockRegistry: Set<MockFn> = new Set();

/**
 * Create a mock function that tracks calls and supports return value configuration.
 * Use this instead for framework-agnostic testing.
 *
 * @example
 * ```typescript
 * const mockGetRole = fn<[number], Promise<RoleData | null>>();
 * mockGetRole.mockResolvedValue(testRole);
 *
 * // After test
 * expect(mockGetRole.calls).toEqual([[1]]);
 * ```
 */
export function fn<TArgs extends unknown[] = unknown[], TReturn = unknown>(): MockFn<TArgs, TReturn> {
	let returnValue: TReturn | undefined;

	const mockFn = ((...args: TArgs): TReturn => {
		mockFn.calls.push(args);
		return returnValue as TReturn;
	}) as MockFn<TArgs, TReturn>;

	mockFn.calls = [];

	mockFn.mockResolvedValue = (value: Awaited<TReturn>) => {
		returnValue = Promise.resolve(value) as TReturn;
		return mockFn;
	};

	mockFn.mockRejectedValue = (error: unknown) => {
		returnValue = Promise.reject(error) as TReturn;
		return mockFn;
	};

	mockFn.mockReturnValue = (value: TReturn) => {
		returnValue = value;
		return mockFn;
	};

	mockFn.mockClear = () => {
		mockFn.calls = [];
	};

	mockRegistry.add(mockFn as MockFn);
	return mockFn;
}

/**
 * Clear all calls from all mock functions created with fn().
 * Call this in beforeEach to ensure clean state between tests.
 */
export function clearAllMocks(): void {
	for (const mock of mockRegistry) {
		mock.mockClear();
	}
}

/**
 * Test cradle holder for swapping container dependencies in tests.
 * This allows tests to provide mock services without using vi.mock.
 *
 * Usage in tests:
 * ```typescript
 * import { setTestCradle, resetTestCradle } from '../../container.mock';
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
