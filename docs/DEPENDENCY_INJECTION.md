# Dependency Injection Guide

This project uses [Awilix](https://github.com/jeffijoe/awilix) for dependency injection in the backend API.

## Overview

The DI container is configured in `src/api/container.ts` and provides:

- **Type-safe dependency resolution** via the `Cradle` interface
- **Singleton lifecycle** for all services and repositories
- **Automatic verification** at server startup

## Dependency Graph

```
AuthService
  ├── UserRepository ──────► db
  ├── AuthRepository ──────► db
  ├── RefreshTokenRepository ► db
  └── PasetoService (no deps)

Middleware/Controllers resolve services inside handler functions.
```

## Adding a New Service

### 1. Create the Service Class

Services should accept dependencies via a destructured object parameter:

```typescript
// src/api/services/my.service.ts

interface MyServiceDeps {
	userRepository: UserRepository;
	someOtherService: SomeOtherService;
}

export class MyService {
	private userRepository: UserRepository;
	private someOtherService: SomeOtherService;

	constructor({ userRepository, someOtherService }: MyServiceDeps) {
		this.userRepository = userRepository;
		this.someOtherService = someOtherService;
	}

	async doSomething(): Promise<void> {
		// Use dependencies
	}
}
```

### 2. Add to Cradle Interface

Update the `Cradle` interface in `src/api/container.ts`:

```typescript
export interface Cradle {
	// ... existing deps
	myService: MyService;
}
```

### 3. Register in Container

Add the registration in `container.register()`:

```typescript
container.register({
	// ... existing registrations
	myService: asClass(MyService).singleton(),
});
```

### 4. Use in Controllers/Middleware

**Important**: Always resolve dependencies inside handler functions, not at module level.
This ensures better test isolation since services are resolved at call time rather than import time.

```typescript
import { container } from '../../container';

// In a Hono route handler
app.post('/endpoint', async (c) => {
	const myService = container.cradle.myService;
	// Use myService...
});

// In middleware
export async function myMiddleware(c: Context, next: Next) {
	const myService = container.cradle.myService;
	// Use myService...
	await next();
}
```

**Avoid module-level resolution:**

```typescript
// DON'T do this - harder to mock in tests
import { container } from '../../container';
const myService = container.cradle.myService; // Resolved at import time

app.post('/endpoint', async (c) => {
	// myService already resolved, can't be mocked easily
});
```

## Adding a New Repository

Repositories extend `BaseRepository` which handles the database connection:

```typescript
// src/api/modules/mymodule/my.repository.ts
import { BaseRepository } from '../../helpers/base.repository';

export class MyRepository extends BaseRepository {
	// No constructor needed - inherited from BaseRepository

	async findById(id: number): Promise<MyData | null> {
		const result = await this.db.select().from(myTable).where(eq(myTable.id, id)).limit(1);

		return result[0] ?? null;
	}
}
```

Then add to `Cradle` and register as `asClass(MyRepository).singleton()`.

## Testing with Mocked Dependencies

### Unit Testing Services

Create a mock container or pass mocked dependencies directly:

```typescript
import { MyService } from './my.service';

describe('MyService', () => {
	it('should do something', async () => {
		// Create mocks
		const mockUserRepo = {
			findById: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
		};

		// Instantiate with mocks
		const service = new MyService({
			userRepository: mockUserRepo as any,
			someOtherService: {} as any,
		});

		await service.doSomething();

		expect(mockUserRepo.findById).toHaveBeenCalled();
	});
});
```

### Integration Testing

For integration tests, use the real container:

```typescript
import { container } from './container';

describe('DI Container Integration', () => {
	it('should resolve all dependencies', () => {
		expect(container.cradle.authService).toBeDefined();
		expect(container.cradle.userRepository).toBeDefined();
	});
});
```

## Scoped Dependencies (Future)

If you need request-scoped dependencies in the future:

```typescript
// Create a scoped container per request
app.use(async (c, next) => {
	const scopedContainer = container.createScope();

	// Register request-specific values
	scopedContainer.register({
		requestId: asValue(c.get('requestId')),
		currentUser: asValue(c.get('user')),
	});

	c.set('container', scopedContainer);
	await next();
});
```

## Best Practices

1. **Resolve dependencies inside handler functions**, not at module level (improves test isolation)
2. **Always use singletons** for stateless services and repositories
3. **Validate configuration early** in container setup (see `validateEnvironment()`)
4. **Keep the Cradle interface updated** when adding/removing dependencies
5. **Use the `verifyContainer()` function** at startup to catch configuration errors
6. **Prefer constructor injection** over property injection for testability

## Troubleshooting

### "PASETO_SECRET_KEY not configured"

Ensure the environment variable is set before starting the server:

```bash
export PASETO_SECRET_KEY=$(openssl rand -hex 32)
```

### Circular Dependency Error

Awilix will throw at resolution time. Fix by:

- Restructuring dependencies
- Using lazy resolution with `asFunction(() => container.cradle.dep)`

### Service Not Found

Check that:

1. Service is added to the `Cradle` interface
2. Service is registered in `container.register()`
3. Import path is correct
