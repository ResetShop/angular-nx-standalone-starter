<!-- Source: CLAUDE.md | Last updated: 2026-02-09 -->

# Testing Examples & Mock Infrastructure

## Basic Component Test Pattern

```typescript
import { render, screen } from '@testing-library/angular';

describe('ButtonComponent', () => {
	it('should render button with text', async () => {
		await render(`<button appButton>Click me</button>`, {
			imports: [ButtonComponent],
		});

		const button = screen.getByRole('button', { name: /click me/i });
		expect(button).toBeInTheDocument();
	});
});
```

## Testing User Interactions

```typescript
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

describe('CounterComponent', () => {
	it('should increment count on button click', async () => {
		const user = userEvent.setup();
		await render(CounterComponent);

		const button = screen.getByRole('button', { name: /increment/i });
		await user.click(button);

		expect(screen.getByText('Count: 1')).toBeInTheDocument();
	});
});
```

## Testing Async Behavior

```typescript
import { render, screen, waitFor } from '@testing-library/angular';

describe('AsyncComponent', () => {
	it('should display data after loading', async () => {
		await render(AsyncComponent);

		// Wait for async content to appear
		await waitFor(() => {
			expect(screen.getByText('Data loaded')).toBeInTheDocument();
		});
	});

	it('should find element that appears asynchronously', async () => {
		await render(AsyncComponent);

		// findBy* queries have built-in waiting
		const element = await screen.findByRole('heading', { name: /welcome/i });
		expect(element).toBeInTheDocument();
	});
});
```

## Testing Services

```typescript
import { render, screen } from '@testing-library/angular';
import { fn } from '@test-utils';

describe('ComponentWithService', () => {
	it('should use injected service', async () => {
		const mockGetUser = fn<[], Promise<{ name: string }>>();
		mockGetUser.mockResolvedValue({ name: 'John' });

		await render(UserProfileComponent, {
			providers: [{ provide: UserService, useValue: { getUser: mockGetUser } }],
		});

		expect(await screen.findByText('John')).toBeInTheDocument();
	});
});
```

## Testing Form Inputs

```typescript
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

describe('LoginFormComponent', () => {
	it('should update input value', async () => {
		const user = userEvent.setup();
		await render(LoginFormComponent);

		const emailInput = screen.getByLabelText(/email/i);
		await user.type(emailInput, 'test@example.com');

		expect(emailInput).toHaveValue('test@example.com');
	});
});
```

## Mock Infrastructure

This project uses a two-layer mock architecture that avoids direct `vi.fn()`, `vi.mock()`, and `jest.fn()` usage. ESLint rules enforce this constraint.

### Layer 1: `@test-utils` (all tests)

The `src/test-utils.ts` module (aliased as `@test-utils`) provides framework-agnostic mock utilities used across all tests:

| Export                    | Purpose                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `fn<TArgs, TReturn>()`    | Create a type-safe mock function with call tracking                |
| `clearAllMocks()`         | Clear call history from all registered mocks (keeps return values) |
| `resetAllMocks()`         | Clear call history and remove all mock references from registry    |
| `useFakeTimers()`         | Enable fake timers for time-dependent tests                        |
| `advanceTimersByTime(ms)` | Advance fake timers by specified milliseconds                      |
| `useRealTimers()`         | Restore real timers                                                |

**`fn()` API example:**

```typescript
import { clearAllMocks, fn } from '@test-utils';

const mockFetch = fn<[number], Promise<User>>();

beforeEach(() => {
	clearAllMocks();
});

it('should fetch user', async () => {
	mockFetch.mockResolvedValue({ id: 1, name: 'John' });

	const result = await mockFetch(1);

	expect(result).toEqual({ id: 1, name: 'John' });
	expect(mockFetch.calls).toEqual([[1]]);
});
```

**Automatic cleanup:** The mock registry auto-clears via an `afterAll` hook registered at module load time, calling `resetAllMocks()` after each test suite.

### Layer 2: `container.mock.ts` (backend DI tests only)

The `src/api/container/container.mock.ts` module provides the `MockContainer` class for backend controller/middleware tests:

| Export          | Purpose                                                      |
| --------------- | ------------------------------------------------------------ |
| `MockContainer` | Implements `IContainer` with a partial cradle for test mocks |

Usage with the singleton `container` from `src/api/container/container.ts`:

| Method                | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `container.use()`     | Replace active container with a `MockContainer` instance |
| `container.restore()` | Remove the delegate, restoring the real Awilix container |

### Timer Wrappers

Always use `@test-utils` timer wrappers instead of `vi.useFakeTimers()` directly:

```typescript
import { advanceTimersByTime, useFakeTimers, useRealTimers } from '@test-utils';

beforeEach(() => {
	useFakeTimers();
});

afterEach(() => {
	useRealTimers();
});

it('should debounce calls', () => {
	triggerAction();
	advanceTimersByTime(300);
	expect(result).toBe(expected);
});
```

### ESLint Enforcement

The `viRestrictedSyntax` ESLint rules forbid direct usage of `vi.fn()`, `vi.mock()`, `vi.useFakeTimers()`, and related Vitest globals. Use the `@test-utils` wrappers instead.
