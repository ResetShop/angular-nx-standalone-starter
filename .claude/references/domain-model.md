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
	id: number
	email: string
	firstName: string
	lastName: string
	roles: IRole[]
	token: string
}

export function createUser(options: CreateUserOptions): IUser {
	return new User(options.id, options.email, options.firstName, options.lastName, options.roles, options.token)
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
	readonly id: number
	readonly email: string
	readonly roles: readonly IRole[]
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
import { z } from 'zod'

export const authStorageDataSchema = z.object({
	id: z.number(),
	email: z.string(),
	token: z.string(),
	roles: z.array(roleSchema),
})

export type AuthStorageData = z.infer<typeof authStorageDataSchema>

// Usage
const result = authStorageDataSchema.safeParse(JSON.parse(stored))
if (result.success) {
	const user = mapStorageDataToUser(result.data)
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

---

# Strategic Patterns

The sections above cover **tactical** patterns — _how_ to build a single model well. The sections below cover **strategic** patterns — _when_ and _why_ to apply those tactics, and how models relate across the system. These are largely framework-agnostic DDD concepts adapted to this project's TypeScript domain.

## Aggregate Design

An **aggregate** is a cluster of domain objects treated as a single unit for data changes. One object is the **aggregate root** — the only entry point, responsible for enforcing every invariant inside the cluster. Callers may hold a reference to the root, never to its internals.

**How to identify the root:** look for the entity that owns the most business invariants. That entity becomes the root because the invariants can only be guaranteed if all mutations flow through it.

In this project, `User` is the aggregate root for session authorization. It owns `readonly IRole[]`, and each `IRole` owns `readonly IPermission[]`. The invariant — _a user's effective permission set is the deduplicated union of all permissions across all roles_ — is enforced in the constructor, so no caller can construct an inconsistent `User`:

```typescript
// user.model.ts — invariant enforced at construction time
constructor(id: number, email: string, firstName: string, lastName: string, roles: IRole[]) {
	this.roles = roles
	const allPermissions = roles.flatMap((role) => role.permissions)
	this._permissions = [...new Map(allPermissions.map((p) => [p.identifier, p])).values()]
	this._permissionIdentifiers = new Set(this._permissions.map((p) => p.identifier))
}
```

**Note:** The aggregate boundary is also the transaction boundary — see [Consistency Decisions](#consistency-decisions).

## Domain Events

A **domain event** is a past-tense fact about something that already happened: `UserDisabled`, `RoleAssigned`, `UserRoleRemoved`, `PermissionGranted`. Name them as facts, never as commands (`PlaceOnHold` is a command; `BookPlacedOnHold` is the event).

Events let one bounded context react to another without a direct call — the producing context records the fact, and consuming contexts subscribe. This decouples contexts: neither needs to know the other's internals.

**Note:** Domain events are **not yet implemented** in this project. Cross-context communication currently happens through mappers (see [Mappers](#mappers)) and direct service calls. This section documents the pattern for the point at which that direct coupling becomes a maintenance burden — for example, when disabling a user must fan out to multiple contexts (audit log, session revocation, notifications) that should not all be wired into one service. The event names above are illustrative — authoritative names will be agreed when events are actually introduced.

## Type-State Pattern

Model an entity's lifecycle states as **distinct types** rather than a single type with a status field, so the compiler rejects operations that are invalid in a given state.

The current approach is a value union — appropriate for the present CRUD use case, where `IManagedUser` carries its state as a field:

```typescript
// src/contracts/user/user.constants.ts — current approach
export const UserStatus = Object.freeze({
	ACTIVE: 'active',
	DISABLED: 'disabled',
	DELETED: 'deleted',
} as const)
```

**Future direction:** when business rules diverge enough between states that a method should only exist in one of them, promote the states to distinct types (`ActiveUser`, `DisabledUser`, `DeletedUser`). A method like `assignRole()` would then exist only on `ActiveUser`, making "assign a role to a deleted user" a _compile error_ rather than a runtime guard. This is forward-looking guidance, not a current requirement — `UserStatus` is the right tool until the rules justify the split.

## Policies as Pure Functions

A **policy** is a business rule extracted into a standalone pure function — no side effects, no injected services — with the shape `(entity, context) → decision`. Because it is pure, it is independently unit-testable, composable, and reusable across backend middleware and frontend guards without dragging a service dependency along.

Existing examples in this project:

- `permission(name: string): PermissionName` (`src/contracts/permission/permission.constants.ts`) — validates and brands an identifier; **throws** on invalid format and returns the branded `PermissionName` on success (a boundary guard, not a decision-returning predicate). Its companion `isPermissionName(name): name is PermissionName` is the pure-predicate form.
- `user.hasPermission(identifier)` / `role.hasPermission(identifier)` — predicate policies on the aggregate.

A new authorization rule follows the same shape:

```typescript
// A policy composes existing predicates — pure, no service dependency
function canAssignRole(actor: IUser, role: IRole): boolean {
	return actor.hasPermission('admin:user_roles:assign') && role.removable
}
```

**Rules:**

- Keep policies free of I/O — pass the data in, return a decision out
- Compose small policies with `&&` / `||` rather than writing one large branching function
- Return `boolean` for simple predicates; return a structured result type when the caller needs the _reason_ for a rejection

## Bounded Context Principles

A **bounded context** is a scope within which one ubiquitous language and one model apply consistently. The same real-world concept can — and should — be modelled differently in different contexts. This project already separates four:

| Context           | Folder                            | Key types              | Perspective                            |
| ----------------- | --------------------------------- | ---------------------- | -------------------------------------- |
| `auth`            | `src/app/domain/auth/`            | _(mappers only)_       | Maps login/`me` responses → `IUser`    |
| `user`            | `src/app/domain/user/`            | `IUser`, `User`        | Who is logged in — O(1) auth checks    |
| `user-management` | `src/app/domain/user-management/` | `IManagedUser`         | Admin CRUD of accounts (status, audit) |
| `access`          | `src/app/domain/access/`          | `IRole`, `IPermission` | Authorization rule definitions         |

The key insight: `IUser` and `IManagedUser` both represent a "user", yet model different concerns. `IUser` is optimised for permission checks during a session and exposes behaviour (`hasPermission`, `hasRole`). `IManagedUser` carries `status`, `statusChangedAt`, `statusChangedBy`, `deletedAt` — fields irrelevant to session auth but essential to administrative views. The mappers (`user.mapper.ts`, `managed-user.mapper.ts`, `auth.mapper.ts`) are the explicit boundaries between these models.

### Ubiquitous Language

Each context owns the **definitions** of its terms, co-located with that context's interfaces. The same word may carry a different meaning per context — "user" in `auth` is a session identity, "user" in `user-management` is an administrable account record — and that divergence is expected, not a bug to reconcile.

**Convention for new contexts:** when a new bounded context is introduced (e.g. `catalog`, `billing`, `subscriptions`), define its vocabulary alongside its interfaces and state, for each term, which existing terms it maps to or deliberately diverges from. This keeps the DDD strategy from being anchored to today's `User` / `Role` / `Permission` vocabulary as the domain grows.

**Note:** A consolidated, per-context glossary (and generator tooling to scaffold a term stub whenever a new context is created) is planned as a separate effort. This section documents the convention; the glossary build-out is tracked independently.

## Consistency Decisions

Choose a consistency model per boundary, not per project:

| Model        | When to apply                                          | Project example                                                                  |
| ------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **Strong**   | Invariants that must hold immediately, within one unit | `User` aggregate — permissions deduplicated at construction, always consistent   |
| **Eventual** | Best-effort state where brief lag is acceptable        | _Future:_ a `UserDisabled` event; active sessions lapse at next token validation |

**Rule:** apply **strong** consistency _within_ an aggregate boundary (a single DB transaction guarantees the invariant), and **eventual** consistency _across_ aggregate or context boundaries (propagated by [domain events](#domain-events)). The decision pivot is the invariant: if it _must_ always be true, keep it inside one aggregate under strong consistency; if a short window of staleness is tolerable, let it converge.

**Note:** The current implementation is strongly consistent throughout — every mutation is a synchronous DB call. Eventual consistency is documented here as guidance for future cross-service scenarios, in tandem with [domain events](#domain-events).
