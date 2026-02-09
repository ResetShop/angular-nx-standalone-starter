import { vi } from 'vitest';

/**
 * Mock function interface - provides call tracking and return value control.
 * Wraps vi.fn() internally while exposing a framework-agnostic API.
 */
export interface MockFn<TArgs extends unknown[] = unknown[], TReturn = unknown> {
	(...args: TArgs): TReturn;
	/** All recorded calls to this mock function */
	readonly calls: readonly TArgs[];
	/** Set a resolved promise as the return value */
	mockResolvedValue: (value: Awaited<TReturn>) => MockFn<TArgs, TReturn>;
	/** Set a rejected promise as the return value */
	mockRejectedValue: (error: unknown) => MockFn<TArgs, TReturn>;
	/** Set a direct return value */
	mockReturnValue: (value: TReturn) => MockFn<TArgs, TReturn>;
	/** Set a custom implementation function */
	mockImplementation: (impl: (...args: TArgs) => TReturn) => MockFn<TArgs, TReturn>;
	/** Clear all recorded calls */
	mockClear: () => void;
}

/**
 * Registry of all created mock functions for bulk operations.
 *
 * This is module-scoped mutable state shared across all tests in a single
 * worker thread. Vitest runs each test file in its own worker, so the
 * registry is isolated per file. Call `resetAllMocks()` in `afterAll()`
 * to release references after a suite completes.
 */
const mockRegistry: Set<MockFn> = new Set();

/**
 * Create a mock function that tracks calls and supports return value configuration.
 * Delegates to vi.fn() internally for reliable behavior.
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
	const viFn = vi.fn<(...args: TArgs) => TReturn>();

	// Use a regular function to preserve `this` context when called as a method
	const mockFn = function (this: unknown, ...args: TArgs): TReturn {
		return viFn.apply(this, args);
	} as MockFn<TArgs, TReturn>;

	// Expose calls via getter that delegates to vi.fn()'s internal tracking
	Object.defineProperty(mockFn, 'calls', {
		get: () => viFn.mock.calls as readonly TArgs[],
		enumerable: true,
	});

	mockFn.mockResolvedValue = (value: Awaited<TReturn>) => {
		viFn.mockResolvedValue(value as Awaited<TReturn>);
		return mockFn;
	};

	mockFn.mockRejectedValue = (error: unknown) => {
		viFn.mockRejectedValue(error);
		return mockFn;
	};

	mockFn.mockReturnValue = (value: TReturn) => {
		viFn.mockReturnValue(value);
		return mockFn;
	};

	mockFn.mockImplementation = (impl: (...args: TArgs) => TReturn) => {
		viFn.mockImplementation(impl);
		return mockFn;
	};

	mockFn.mockClear = () => {
		viFn.mockClear();
	};

	mockRegistry.add(mockFn as MockFn);
	return mockFn;
}

/**
 * Clear all recorded calls from every mock function created with fn().
 * Call this in beforeEach to ensure clean state between tests.
 *
 * Only clears call history — configured return values and implementations
 * are retained so mocks don't need to be reconfigured each test.
 */
export function clearAllMocks(): void {
	for (const mock of mockRegistry) {
		mock.mockClear();
	}
}

/**
 * Clear all mock call history and remove all mock references from the registry.
 * Call this in afterAll to release mock references after a test suite completes.
 */
export function resetAllMocks(): void {
	for (const mock of mockRegistry) {
		mock.mockClear();
	}
	mockRegistry.clear();
}

/**
 * Use fake timers for controlling time-dependent behavior in tests.
 * Wraps vi.useFakeTimers() to centralize Vitest dependencies.
 */
export function useFakeTimers(): void {
	vi.useFakeTimers();
}

/**
 * Advance all fake timers by a specified number of milliseconds.
 * Wraps vi.advanceTimersByTime() to centralize Vitest dependencies.
 */
export function advanceTimersByTime(ms: number): void {
	vi.advanceTimersByTime(ms);
}

/**
 * Restore real timers after using fake timers.
 * Wraps vi.useRealTimers() to centralize Vitest dependencies.
 */
export function useRealTimers(): void {
	vi.useRealTimers();
}
