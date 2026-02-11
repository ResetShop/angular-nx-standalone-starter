<!-- Source: CLAUDE.md | Last updated: 2026-02-09 -->

# Domain Model Guidelines

## Structure

Organize domain models by bounded context:

```
src/app/domain/
├── <context>/              # e.g., access/, user/, auth/
│   ├── <entity>.interface.ts
│   ├── <entity>.model.ts
│   ├── <entity>.mapper.ts
│   └── <entity>.model.spec.ts
```

## Interface-First Design

Define interfaces for domain entities. Components depend on interfaces, not concrete classes:

```typescript
// permission.interface.ts
export interface IPermission {
	readonly id: number;
	readonly resource: string;
	readonly action: string;
	matches(resource: string, action: string): boolean;
}

// permission.model.ts
export class Permission implements IPermission { ... }
```

**Note:** Use `I` prefix for domain interfaces when a concrete class with the same name exists (e.g., `IUser`/`User`). This distinguishes the contract from the implementation.

## Factory Functions

Use factory functions to abstract instantiation. Return interfaces, not concrete classes:

```typescript
// user.mapper.ts
interface CreateUserOptions {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	roles: IRole[];
	token: string;
}

export function createUser(options: CreateUserOptions): IUser {
	return new User(options.id, options.email, options.firstName, options.lastName, options.roles, options.token);
}
```

**Rules:**

- Use **options object pattern** for functions with 3+ parameters
- Keep options interfaces **private** (not exported) — TypeScript infers the type at call sites
- Return the **interface type**, not the concrete class

## Immutability

Domain objects should be immutable after construction:

```typescript
export class User implements IUser {
	readonly id: number;
	readonly email: string;
	readonly roles: readonly IRole[];
	// ...
}
```

- Mark all properties `readonly`
- Use `readonly T[]` for array properties
- Compute derived values in constructor, store in private fields

## Performance: O(1) Lookups

For frequently-checked collections, use `Set<string>` for O(1) lookups:

```typescript
export class User implements IUser {
	private readonly _permissionIdentifiers: ReadonlySet<string>;

	constructor(...) {
		this._permissionIdentifiers = new Set(
			permissions.map((p) => p.identifier)
		);
	}

	hasPermission(resource: string, action: string): boolean {
		return this._permissionIdentifiers.has(`${resource}:${action}`);
	}
}
```

## Runtime Validation

Use **Zod** for validating external data (localStorage, API responses):

```typescript
import { z } from 'zod';

export const authStorageDataSchema = z.object({
	id: z.number(),
	email: z.string(),
	token: z.string(),
	roles: z.array(roleSchema),
});

export type AuthStorageData = z.infer<typeof authStorageDataSchema>;

// Usage
const result = authStorageDataSchema.safeParse(JSON.parse(stored));
if (result.success) {
	const user = mapStorageDataToUser(result.data);
}
```

## Mappers

Use mappers to transform between layers (API contracts ↔ domain models ↔ storage):

| Function                   | Purpose                     |
| -------------------------- | --------------------------- |
| `mapLoginResponseToUser()` | API response → domain model |
| `mapStorageDataToUser()`   | localStorage → domain model |
| `mapUserToStorageData()`   | domain model → localStorage |

Mappers should use factory functions internally for consistency.
