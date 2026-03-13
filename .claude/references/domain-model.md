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

## Component-Level Data Binding

Components must bind exclusively to **domain interfaces** (`IPermission`, `IRole`, `IUser`) or their aggregate models. Contract DTOs (`PermissionData`, `RoleData`) belong to the API/provider layer only — they must never be imported or referenced in components.

The boundary is clear: API services and store internals may use DTOs, but from the store's public surface upward (components, templates, column definitions), only domain interfaces are allowed. Domain models expose computed properties (e.g., `identifier`, `fullName`) and behavior methods that encode business rules in a single place.

**Pattern:** The DTO → domain model mapping belongs in the store (e.g., a `withComputed` block), so the store's public signals already expose domain interfaces. Components simply consume them:

```typescript
// ✅ Correct — store exposes domain models, component binds to domain interface
readonly columns: ColumnDef<IPermission, unknown>[] = [
	{ accessorKey: 'identifier', header: 'Identifier' }, // computed getter on IPermission
];
```

**Rules:**

- Column definitions, template bindings, and any UI logic must reference domain interfaces, not contract types
- DTO → domain model mapping is done in the store via factory functions (`createPermission`, `createUser`, etc.) from `@domain/<context>/<entity>.mapper.ts`
- DTOs are confined to API services and store internals — they must never cross into the component layer

## Mappers

Use mappers to transform between layers (API contracts ↔ domain models ↔ storage):

| Function                   | Purpose                     |
| -------------------------- | --------------------------- |
| `mapLoginResponseToUser()` | API response → domain model |
| `mapStorageDataToUser()`   | localStorage → domain model |
| `mapUserToStorageData()`   | domain model → localStorage |

Mappers should use factory functions internally for consistency.
