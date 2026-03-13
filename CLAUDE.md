# Project Guidelines

> **Purpose:** This document provides coding standards, architectural principles, and tooling guidelines for this project. Claude Code should follow these guidelines when generating, reviewing, or modifying code.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Hard Constraints](#hard-constraints)
3. [Nx Guidelines](#nx-guidelines)
4. [Testing Guidelines](#testing-guidelines)
5. [Code Architecture Guidelines](#code-architecture-guidelines)
6. [Backend API Architecture](#backend-api-architecture)
7. [Backend API Naming Conventions](#backend-api-naming-conventions)
8. [Error Handling Guidelines](#error-handling-guidelines)
9. [Domain Model Guidelines](#domain-model-guidelines)
10. [Development Workflow](#development-workflow)
11. [Automated Code Review](#automated-code-review)

---

## Project Overview

<!-- TODO: Customize this section for your specific project -->

| Aspect               | Value                               |
| -------------------- | ----------------------------------- |
| **Framework**        | Angular 17+ (standalone components) |
| **Language**         | TypeScript (strict mode)            |
| **Monorepo Tool**    | Nx                                  |
| **Package Manager**  | npm                                 |
| **Testing**          | Vitest + Angular Testing Library    |
| **State Management** | NgRx Signal Store + `rxMethod`      |

### Common Commands

Use `npm` for all package management and script execution:

| Command                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `npm install`              | Install dependencies                           |
| `npm run ci`               | Run all CI checks locally (required before PR) |
| `npm run build`            | Build the project                              |
| `npm run dev`              | Start development server                       |
| `npm run lint`             | Run linting                                    |
| `npm run storybook`        | Run storybook dev server                       |
| `npm run storybook:build`  | Build storybook                                |
| `npm run stylelint`        | Run stylelint                                  |
| `npm run typecheck`        | Type-check spec files (tsc --noEmit)           |
| `npm run test`             | Run all unit tests                             |
| `npm run test:integration` | Run backend integration tests (requires DB)    |
| `npm run test:e2e`         | Run all end-to-end tests                       |
| `npm install <pkg>`        | Add a dependency                               |
| `npm install -D <pkg>`     | Add a dev dependency                           |
| `npm install -g <pkg>`     | Add a global dependency                        |

#### CRITICAL: Command Execution Policy

**Claude MUST follow these rules when executing commands:**

1. **Use ONLY the exact patterns listed above** - No variants, no construction, no "helpful" alternatives
2. **Check `.claude/settings.local.json` before running ANY command** to verify the pattern is allowed
3. **NEVER use direct `nx` commands** - Always use `npm run <task>` instead
4. **NEVER construct variants** like:
   - ❌ `npm test -- <args>`
   - ❌ `npm exec nx test <project>`
   - ❌ `nx test <project>`
   - ❌ `nx run <project>:<task>`
5. **If a correction is given, apply the pattern to ALL related commands immediately** (test → build → lint → dev)

**Example: Running tests**

- ✅ Correct: `npm run test`
- ❌ Wrong: `nx test app`, `npm test --`, `npm exec nx test`

This is a hard constraint. Violations break the workflow and require user intervention.

#### Git Command Rules

1. **Never prefix git commands with `cd`** — the working directory is already at the project root. Using `cd <root> && git ...` changes the command signature and breaks auto-approve permission patterns.
2. **Use simple `git commit -m "message"`** — never use `$(cat <<'EOF'...)` HEREDOC substitution for commit messages. It changes the command signature and requires manual permission approval.

### Folder Structure Conventions

```
apps/
  └── <app-name>/
libs/
  ├── feature/          # Smart components, route containers
  ├── ui/               # Presentational/dumb components
  ├── data-access/      # Services, state management, API calls
  └── util/             # Pure functions, helpers, types
```

### Naming Conventions

- **Files:** `kebab-case` (e.g., `user-profile.component.ts`)
- **Classes:** `PascalCase` (e.g., `UserProfileComponent`)
- **Interfaces:** `PascalCase`. Use `I` prefix only for domain model interfaces where a concrete class exists (e.g., `IUser`/`User`). Omit prefix for DTOs and general interfaces (e.g., `CreateRoleParams`).
- **Functions/Methods:** `camelCase` (e.g., `getUserById`)
- **Constants:** `SCREAMING_SNAKE_CASE` for true global constants; `camelCase` for local constants

### Scope Rules for Constants and Variables

- **Local constants:** Keep inside the function scope when used by a single function. Declare them as close as possible to the point of evaluation — never at the top of a file when the only usage is deep inside a single function
- **Module constants:** Promote to module level only when shared across multiple functions in the same file
- **Global constants:** Use only after analysis confirms reuse across multiple files

**Default is local scope.** When writing code, fixing issues, or suggesting improvements, always prefer a local `const` over a module-level declaration. Never introduce a module-level variable or constant as part of a fix when the value is only consumed by a single function — use an inline literal or a function-scoped `const` instead.

**Rationale:** A constant declared 50+ lines away from its single usage forces the reader to scroll and mentally link two distant locations. Co-locating the constant with its usage, when the usage is single, makes the code self-contained and easier to follow.

---

## Hard Constraints

These are non-negotiable rules. Violations require explicit justification.

| Constraint                   | Limit                                                                                                                      | Rationale                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Function length              | ≤ 50 lines                                                                                                                 | Readability, SRP             |
| File length                  | ≤ 500 lines (spec files exempt)                                                                                            | Maintainability              |
| Cyclomatic complexity        | ≤ 10                                                                                                                       | Testability                  |
| Nesting depth                | ≤ 3 levels                                                                                                                 | Readability                  |
| Barrel imports/exports       | Not allowed in any part of the project                                                                                     | Maintainability, Performance |
| `any` type                   | Forbidden without `// REASON:` comment                                                                                     | Type safety                  |
| `// @ts-ignore`              | Forbidden without linked issue                                                                                             | Technical debt tracking      |
| `console.log`                | Remove before commit                                                                                                       | Clean code                   |
| TypeScript enums             | Forbidden - use `Object.freeze()` instead                                                                                  | Consistency, type safety     |
| Type-only imports            | Use `type` keyword for types/interfaces when only used in the context of type annotations                                  | Bundle size, clarity         |
| Raw time literals            | Forbidden — use duration strings (`'15m'`, `'1h'`, `'7d'`) resolved via `parseDurationToMs()` / `parseDurationToSeconds()` | Readability, consistency     |
| `vi.fn()`/`vi.mock()`        | Forbidden — use `fn()` from `@test-utils`; ESLint enforced                                                                 | Framework independence       |
| `firstValueFrom`/`toPromise` | Forbidden in Angular frontend (`src/app/`) — use `rxMethod` from `@ngrx/signals/rxjs-interop` instead                      | Signals-first, no promises   |
| `TestBed.flushEffects()`     | Deprecated since Angular 20 — use `TestBed.tick()` instead                                                                 | API deprecation              |
| External repo issues         | Never create issues on repos where the user is not a contributor — inform the user and let them create it themselves       | Ownership, etiquette         |

### Object.freeze() Instead of Enums

TypeScript enums are forbidden in this project. Use `Object.freeze()` with `as const` for key/value references instead.

```typescript
// ✅ Correct - using Object.freeze()
export const AuthErrorCode = Object.freeze({
	INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
	ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
	ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
} as const);

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

// ❌ Incorrect - using enum
export enum AuthErrorCode {
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
	ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
}
```

**Benefits:**

- Consistent with JavaScript idioms (plain objects)
- Better tree-shaking by bundlers
- More flexible (can be extended, merged, or computed)
- No TypeScript-specific runtime overhead
- Works seamlessly with `typeof` and `keyof` for type extraction

**Usage:**

```typescript
// Type-safe usage
function handleError(code: AuthErrorCode) {
	if (code === AuthErrorCode.ACCOUNT_LOCKED) {
		// ...
	}
}

// The type is a union of literal types:
// type AuthErrorCode = 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCOUNT_DISABLED'
```

### Type-Only Imports

Always use the `type` keyword when importing types, interfaces, or type aliases that are only used for type annotations:

```typescript
// ✅ Correct - using type keyword
import type { User } from './user.interface';
import { type IUserRepository, type UserDTO } from './user.types';
import { UserService } from './user.service'; // No type keyword - used at runtime

// ❌ Incorrect - missing type keyword for type-only imports
import { User, IUserRepository } from './user.types';
```

**Benefits:**

- Smaller bundle size (type imports are completely removed from compiled output)
- Clear intent (immediately visible that import is only for type checking)
- Required for TypeScript's `isolatedModules` compiler option
- Better tree-shaking by bundlers

**When to use:**

- Interfaces, type aliases, or types used only in type annotations
- Classes used only as types (e.g., `user: User` but never `new User()`)

**When NOT to use:**

- Classes used at runtime (constructors, static methods)
- Enums (compiled to runtime objects)
- Functions or constants
- Anything used in expressions or statements

### Duration String Convention

All time-related constants must use duration string notation (`'{number}{unit}'`, e.g., `'1h'`, `'15m'`, `'7d'`) as their source of truth, resolved to milliseconds or seconds at the point of use via `parseDurationToMs()` / `parseDurationToSeconds()` from `src/utils/duration.ts` (path alias: `@utils/duration`).

**Rules:**

1. **No `_MS` or `_SECONDS` suffixes** on constant names — the suffix encodes the resolved unit, which is an implementation detail of the expression that uses the value
2. **Extract to named constants** — inline duration string literals used in more than one location (production or test code) must be extracted to a named constant in the appropriate constants file
3. **Resolve at point of use** — call `parseDurationToMs()` or `parseDurationToSeconds()` directly in the expression that needs the numeric value; never store the resolved number in a constant

```typescript
// ✅ Correct — duration string constant, resolved at point of use
export const REFRESH_TOKEN_EXPIRY_BUFFER = '1h';

// In repository:
const cutoffTime = new Date(Date.now() - parseDurationToMs(REFRESH_TOKEN_EXPIRY_BUFFER));

// ❌ Incorrect — raw millisecond literal
export const REFRESH_TOKEN_EXPIRY_BUFFER_MS = 3600000;

// ❌ Incorrect — computed expression
export const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

// ❌ Incorrect — suffix encodes the unit
export const HEALTH_CHECK_TIMEOUT_MS = 5000;
```

**Existing compliant constants (reference as established pattern):**

| Constant                       | File                                         | Value   |
| ------------------------------ | -------------------------------------------- | ------- |
| `DEFAULT_LOCKOUT_DURATION`     | `src/api/constants/auth.constants.ts`        | `'15m'` |
| `DEFAULT_ACCESS_TOKEN_EXPIRY`  | `src/api/constants/auth.constants.ts`        | `'15m'` |
| `DEFAULT_REFRESH_TOKEN_EXPIRY` | `src/api/constants/auth.constants.ts`        | `'7d'`  |
| `REFRESH_TOKEN_EXPIRY_BUFFER`  | `src/api/constants/auth.constants.ts`        | `'1h'`  |
| `HEALTH_CHECK_TIMEOUT`         | `src/api/modules/health/health.constants.ts` | `'5s'`  |

### Signals-First State Management (No Promises)

The Angular frontend (`src/app/`) uses `@ngrx/signals` with `rxMethod` from `@ngrx/signals/rxjs-interop` for all async operations. **Promises are forbidden** — never use `firstValueFrom`, `lastValueFrom`, `toPromise`, or `async/await` on observables in store methods.

**References:** [NgRx RxJS integration guide](https://ngrx.io/guide/signals/rxjs-integration) | [rxMethod source](https://github.com/ngrx/platform/blob/main/modules/signals/rxjs-interop/src/rx-method.ts) | [rxMethod tests](https://github.com/ngrx/platform/blob/main/modules/signals/rxjs-interop/spec/rx-method.spec.ts)

**Rules:**

1. **Use `rxMethod<T>(pipe(...))` for all store methods** that call API services returning observables
2. **Use `tap` for side effects** (state patches via `patchState`) and `catchError(() => EMPTY)` for error handling
3. **Use `switchMap` as the default flattening operator** — cancels stale in-flight requests
4. **Reactive reads use computed signals + `withHooks.onInit`** — pass a computed signal to `rxMethod` so state changes automatically trigger re-fetches (e.g., pagination, search)
5. **Imperative mutations accept static values** — `rxMethod<CreateUserRequest>` called directly with data
6. **No optimistic in-place updates** — all mutations reload the full list from the server after success via `store.loadX(store.listParams())`
7. **Derived values are computed signals, not stored state** — e.g., `totalPages` must be in `withComputed`, never in the state interface
8. **Use `SearchPaginationParams` from `@contracts/common/pagination.types`** for `rxMethod` type params and provider method signatures — never define inline pagination types

```typescript
// ✅ Correct — rxMethod with observable pipe, error logging, structured error
createUser: rxMethod<CreateUserRequest>(
  pipe(
    tap(() => patchState(store, {
      isCreating: true,
      mutationError: patchMutationError(store.mutationError(), 'create', null),
    })),
    switchMap((body) =>
      usersApi.create(body).pipe(
        tap({
          next: () => {
            patchState(store, { isCreating: false });
            store.loadUsers(store.listParams()); // full reload, not optimistic
          },
          // TODO(#66): Replace with structured logging service
          error: (err) => {
            console.error('[UsersStore] createUser failed:', err);
            patchState(store, {
              isCreating: false,
              mutationError: patchMutationError(store.mutationError(), 'create', 'Failed to create user'),
            });
          },
        }),
        catchError(() => EMPTY),
      ),
    ),
  ),
),

// ❌ Incorrect — promise-based with firstValueFrom
async createUser(body: CreateUserRequest): Promise<void> {
  try {
    const response = await firstValueFrom(usersApi.create(body));
    patchState(store, { ... });
  } catch { ... }
}
```

**Reactive list pattern (pagination/search):**

```typescript
// Computed signal derives request params from state
withComputed((store) => ({
  listParams: computed(() => ({
    offset: (store.currentPage() - 1) * store.pageSize(),
    limit: store.pageSize(),
    search: store.searchQuery() || undefined,
  })),
})),

// rxMethod watches the signal — re-fires on any param change
withHooks({
  onInit(store) {
    store.loadUsers(store.listParams);
  },
}),
```

**`rxMethod` invocation modes:**

`rxMethod` accepts both signal references (reactive) and static values (imperative). Use this to support explicit reloads without inventing counter-based workarounds:

```typescript
// ✅ Reactive — pass a signal reference, rxMethod watches and re-fires on changes
store.loadUsers(store.listParams);

// ✅ Imperative — pass the current value (static), triggers a one-shot fetch
store.loadUsers(store.listParams());

// ❌ NEVER use counter/trigger signals to force re-evaluation of rxMethod
// reloadCounter, _reload, forceRefresh, etc. are unnecessary workarounds
```

For explicit reload methods, use a second `withMethods` block (which has access to methods from prior blocks):

```typescript
withMethods((store) => ({
  reload(): void {
    store.loadUsers(store.listParams());  // imperative call with current value
  },
})),
```

**Structured error tracking:**

Error state uses per-operation typed objects, not single `string | null` fields. Each store defines `ReadError` and `MutationError` interfaces in its `*.types.ts`:

```typescript
// ✅ Correct — per-operation error keys
export interface UsersReadError {
	list: string | null;
}
export interface UsersMutationError {
	create: string | null;
	update: string | null;
	delete: string | null;
}

// ❌ Incorrect — single shared error field
readError: string | null;
mutationError: string | null;
```

Helper functions `patchReadError` / `patchMutationError` in each store handle type-safe error patching. Computed signals `hasReadError` / `hasMutationError` provide boolean checks for the UI. Every error handler must log via `console.error` with `[StoreName] methodName failed:` prefix (until #66 introduces a structured logging service).

**Store builder block structure:**

Stores follow a consistent block ordering with two `withComputed` and two `withMethods` blocks:

1. `withState(initialState)`
2. `withComputed` — `totalPages`, `isAnyLoading`, `hasReadError`, `hasMutationError`, `listParams`
3. `withComputed` — `hasNextPage`, `hasPreviousPage` (depends on `totalPages` from block 2)
4. `withMethods` — read operations (`loadX` via `rxMethod`), sync setters (`setPage`, `setPageSize`, `setSearchQuery`), `selectX`, `clearErrors`
5. `withMethods` — `reload()`, then mutation methods in CRUD order: `create` → `update` → `delete` → domain-specific (e.g., `assignPermissions`)
6. `withHooks` — `onInit` passes `listParams` signal to reactive `rxMethod`

**Store test mock typing:**

```typescript
// ✅ Correct — structurally linked to the real service
let apiMock: Record<keyof UsersApiService, MockFn>;

// ❌ Incorrect — inline object literal not linked to service
let apiMock: { getAll: MockFn<...>; create: MockFn<...>; ... };
```

**Existing stores following this pattern:**

| Store              | File                                             |
| ------------------ | ------------------------------------------------ |
| `AuthStore`        | `src/app/store/auth/auth.store.ts`               |
| `UsersStore`       | `src/app/store/users/users.store.ts`             |
| `RolesStore`       | `src/app/store/roles/roles.store.ts`             |
| `PermissionsStore` | `src/app/store/permissions/permissions.store.ts` |
| `UIStore`          | `src/app/store/ui/ui.store.ts`                   |

---

## Nx Guidelines

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

### General Rules

- **CRITICAL: Always use `npm run <task>` for all task execution** (build, lint, test, e2e, dev)
- ❌ Do NOT use direct `nx` commands (`nx run`, `nx run-many`, `nx affected`)
- ✅ Use patterns from Common Commands section above and `.claude/settings.local.json`
- You have access to the Nx MCP server and its tools—use them for workspace analysis, NOT for running tasks

### MCP Tool Usage

| Tool                        | When to Use                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| `nx_workspace`              | First step when answering questions about repository architecture            |
| `nx_project_details`        | When working on individual projects to understand structure and dependencies |
| `nx_docs`                   | For configuration questions, best practices, or when unsure—never assume     |
| `nx_cloud_cipe_details`     | When user needs help with CI pipeline errors                                 |
| `nx_cloud_fix_cipe_failure` | To retrieve logs for specific failed tasks                                   |

### CI Error Resolution Flow

1. Retrieve current CI Pipeline Executions using `nx_cloud_cipe_details`
2. If errors exist, use `nx_cloud_fix_cipe_failure` to get task logs
3. Analyze logs and help fix the problem using appropriate tools
4. Verify the fix by running the failing task locally using `npm run <task>` (e.g., `npm run test`, `npm run build`)

### Nx Conventions

<!-- TODO: Customize these for your workspace -->

**Project Tags** (for `@nx/enforce-module-boundaries`):

- `type:app`, `type:feature`, `type:ui`, `type:data-access`, `type:util`
- `scope:shared`, `scope:feature-*`

**Generators:**

```bash
# Prefer standalone components
nx g @nx/angular:component --standalone

# New library
nx g @nx/angular:library --directory=libs/<scope>/<name> --standalone
```

<!-- nx configuration end-->

---

## Testing Guidelines

### Core Rules

- **ALWAYS use Angular Testing Library** (`@testing-library/angular`)
- **NEVER use** `ComponentFixture`, `TestBed.createComponent()`, or `fixture.nativeElement`
- **NEVER use** `querySelector`, `querySelectorAll`, `closest`, or `container` queries
- Test **user behavior**, not implementation details
- Use `fn()` from `@test-utils` for mock functions — **never** use `vi.fn()`, `vi.mock()`, or `jest.fn()` directly
- **Always call `clearAllMocks()` from `@test-utils` in `beforeEach`** to reset all mock state between tests — never use `mockClear()` / `mockReset()` on individual mocks in `afterEach`
- Add an updated entry in the Bruno API client workspace for each new endpoint
- Update the entries in the Bruno API client workspace if an endpoint is updated
- **Backend endpoints require integration tests** — every new or modified API endpoint must have corresponding integration tests in `src/api/integration/`. See `.claude/references/testing.md` for conventions.

### Query Priority

Use queries in this order of preference:

| Priority | Query                  | Use Case                                      |
| -------- | ---------------------- | --------------------------------------------- |
| 1st      | `getByRole`            | Interactive elements (best for accessibility) |
| 2nd      | `getByLabelText`       | Form fields                                   |
| 3rd      | `getByPlaceholderText` | Inputs with placeholders                      |
| 4th      | `getByText`            | Non-interactive text content                  |
| 5th      | `getByDisplayValue`    | Current value of form elements                |
| 6th      | `getByAltText`         | Images                                        |
| 7th      | `getByTitle`           | Elements with title attribute                 |
| Last     | `getByTestId`          | When semantic queries aren't possible         |

> Full testing examples and mock infrastructure: See `.claude/references/testing.md`

---

## Code Architecture Guidelines

> Guiding Principles (YAGNI, KISS): See `.claude/references/guiding-principles.md`

> CUPID Principles: See `.claude/references/cupid.md`

> SOLID Principles: See `.claude/references/solid.md`

> Clean Architecture Principles: See `.claude/references/clean-architecture.md`

> Principles Cross-Reference: See `.claude/references/cross-reference.md`

> Authentication Architecture: See `.claude/references/auth.md`

> Backend API Architecture: See `.claude/references/backend-api.md`

### Component Field Visibility

Component class fields must use `protected` — never leave them implicitly `public`. Angular templates can access `protected` members, so there is no reason to expose fields beyond the component boundary. Fields that are not used in the template should be `private`.

```typescript
// ✅ Correct — template-bound fields are protected
export default class PermissionsList {
	protected readonly store = inject(PermissionsStore);
	protected readonly columns: ColumnDef<IPermission, unknown>[] = [...];
}

// ❌ Incorrect — public fields leak the component's internal API
export default class PermissionsList {
	readonly store = inject(PermissionsStore);
	readonly columns: ColumnDef<IPermission, unknown>[] = [...];
}
```

**Rules:**

- `protected` for all fields and methods used in the template
- `private` for internal fields and methods not referenced in the template
- Never use `public` (implicit or explicit) on component class members

### App Initializer Pattern

All `provideAppInitializer` calls **must** use a named factory function that returns an async closure. Never inline the initializer logic directly in `app.config.ts`.

```typescript
// ✅ Correct — named factory in a dedicated file (e.g., translation.initializer.ts)
export function initializeTranslation() {
	return async () => {
		const translation = inject(Translation);
		await translation.loadDefaultLanguage();
	};
}

// Usage in app.config.ts:
provideAppInitializer(initializeTranslation()),

// ❌ Incorrect — inline lambda
provideAppInitializer(() => inject(Translation).loadDefaultLanguage()),
```

**Rules:**

1. Create a dedicated `<name>.initializer.ts` file alongside the provider/store it initializes
2. Export a named function (`initializeX`) that returns `async () => { ... }`
3. Use `inject()` inside the returned async closure (injection context is available there)
4. Register in `app.config.ts` as `provideAppInitializer(initializeX())`
5. Private initializers that depend on app-level imports (e.g., `environment`) may be defined as module-scoped functions in `app.config.ts` itself (see `initializeAnalytics`)

**Existing initializers:**

| Initializer             | File                                                |
| ----------------------- | --------------------------------------------------- |
| `initializeAnalytics`   | `src/app/app.config.ts` (private, uses env)         |
| `initializeTranslation` | `src/app/providers/i18n/translation.initializer.ts` |

---

## Backend API Architecture

The backend uses **OpenAPIHono** (`@hono/zod-openapi`). Every endpoint is a typed `createRoute()` definition with Zod schemas, handled via `registerRoute()`. The spec is auto-generated at `/api/openapi.json`.

### Layer Conventions

| Layer             | File pattern      | Responsibility                                                     |
| ----------------- | ----------------- | ------------------------------------------------------------------ |
| Route definitions | `*.routes.ts`     | `createRoute()` — method, path, schemas, security                  |
| Handlers          | `*.controller.ts` | `registerRoute(app, route, handler)` — business logic              |
| Module routers    | `index.ts`        | `app.route()` — composes controllers into sub-app                  |
| Server            | `server.ts`       | Root app — mounts modules under `/api`, registers security schemes |

### File Naming

| Suffix            | Purpose                                     | Location                    |
| ----------------- | ------------------------------------------- | --------------------------- |
| `*.routes.ts`     | Route definitions (`createRoute()`)         | `src/api/modules/<domain>/` |
| `*.controller.ts` | Handler implementations (`registerRoute()`) | `src/api/modules/<domain>/` |
| `*.schemas.ts`    | Module-local Zod schemas                    | `src/api/modules/<domain>/` |
| `*.schemas.ts`    | Shared contract schemas                     | `src/contracts/<domain>/`   |
| `*.types.ts`      | TypeScript types/interfaces                 | `src/contracts/<domain>/`   |

### Key Rules

- **Always** use `createOpenAPIApp()` — never `new OpenAPIHono()` (except root apps: `server.ts` and `test-app.ts`)
- **Always** use `registerRoute(app, route, handler)` — never `app.openapi()` directly
- **Separate** route definitions (`*.routes.ts`) from handlers (`*.controller.ts`) — never inline both
- Path parameters use `{id}` syntax (OpenAPI), not `:id` (Express)
- **Always** add explicit type annotations to `c.req.valid()` calls
- Use `commonResponses` for standard error responses (401, 403, 500) on all protected endpoints

### Security Convention

| Pattern   | Route definition                                       | Use case                              |
| --------- | ------------------------------------------------------ | ------------------------------------- |
| Protected | _(omit `security`)_                                    | Default — inherits global PASETO auth |
| Public    | `security: []`                                         | Login, refresh, health check          |
| Dual-auth | `security: [{ pasetoCookie: [] }, { cronSecret: [] }]` | OR semantics — either auth suffices   |

> Full reference with code examples: See `.claude/references/backend-api.md`

---

## Backend API Naming Conventions

### Repository Layer — Data Access Naming

| Pattern          | Usage                                                                | Example                                                                |
| ---------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `find*()`        | All read operations (single entity, relationships, filtered lookups) | `findById()`, `findByEmail()`, `findAll()`, `findPermissionsForRole()` |
| `find*()` → bool | Boolean predicates (existence checks, membership tests)              | `findUserHasRole()`, `findEmailExists()`                               |
| `create()`       | Insert a new record                                                  | `create(params)`                                                       |
| `update()`       | Modify an existing record                                            | `update(id, params)`                                                   |
| `delete()`       | Remove a record                                                      | `delete(id)`                                                           |
| Domain verbs     | Domain-specific write operations                                     | `revokeToken()`, `assignPermissions()`, `incrementFailedAttempts()`    |

**Key rule:** Repositories always use `find*()` for reads — never `get*()`. Boolean predicates also use `find*()` with a descriptive suffix like `Has*` or `Exists*` (e.g., `findUserHasRole()`, `findEmailExists()`).

### Service Layer — Business Logic Naming

| Pattern                   | Usage                                           | Example                                             |
| ------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| `get[Entity]()`           | Single-entity retrieval (wraps repo `find*`)    | `getRole(id)`, `getRoleByCode(code)`                |
| `getAll[Entities]()`      | Paginated list retrieval (wraps repo `findAll`) | `getAllRoles(params)`, `getAllPermissions(params)`  |
| `create[Entity]()`        | Business logic + repo `create`                  | `createRole(params)`                                |
| `update[Entity]()`        | Business logic + repo `update`                  | `updateRole(id, params)`                            |
| `delete[Entity]()`        | Business logic + repo `delete`                  | `deleteRole(id)`                                    |
| `get[Entity][Relation]()` | Relationship data                               | `getRolePermissions()`, `getUserRoles()`            |
| `assign/remove`           | Relationship mutations                          | `assignPermissionsToRole()`, `removeRoleFromUser()` |
| Domain verbs              | Auth/domain-specific operations                 | `authenticate()`, `logout()`, `refreshToken()`      |

**Key rule:** Services always use `get*()` for reads — never `find*()` or `list()`.

### Repository Projection Types

Define **file-local** interfaces with the `Projection` suffix for query result shapes used internally by repository methods. These types represent the specific column selection of a query — not the full table schema or a domain type. They must not be exported.

```typescript
// File-local — not exported
interface UserProjection {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	status: UserStatus;
	statusChangedAt: Date | null;
	statusChangedBy: number | null;
	deletedAt: Date | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}
```

**Rules:**

- Use `Projection` suffix to distinguish from domain types (`UserData`, `RoleData`)
- Keep file-local (not exported) — these are internal to the repository
- Extract when a query result type is used in method signatures or appears inline with 3+ fields
- Inline anonymous types in Drizzle `.select()` calls are fine — the `Projection` type captures the output shape when passed between methods

---

## Error Handling Guidelines

<!-- TODO: Customize for your project -->

### General Rules

- Handle errors at the appropriate level—don't catch and ignore
- Use typed errors when possible
- Log errors with sufficient context for debugging
- User-facing errors should be actionable and friendly

### Angular-Specific

```typescript
// Global error handler
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
	handleError(error: Error): void {
		// Log to monitoring service
		// Show user-friendly notification
	}
}

// HTTP errors via interceptor
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			// Handle based on status code
			// Transform to user-friendly message
			return throwError(() => error);
		}),
	);
};
```

---

## Domain Model Guidelines

> Full domain model guidelines: See `.claude/references/domain-model.md`

---

## Development Workflow

### Git Conventions

**Branch naming:** `<issue_number>-<issue-title-in-kebab-case>`

```
# Examples
144-remove-vercel-specific-configuration
87-add-user-authentication
```

**Commit messages:** `[#<issue_number>] - <title>`

```
[#144] - Remove vercel.json and API redirect entry point
[#87] - Add login form component
```

**PR titles:** `[#<issue_number>] - <title>`

```
[#144] - Remove Vercel-specific configuration
[#87] - Add user authentication
```

### Agent Orchestration

Use the Task tool to delegate to specialized agents at each development phase:

| Phase          | Trigger                              | Agents                                                                |
| -------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Planning       | New feature/component/module/service | `architecture-advisor`, `domain-model-advisor`                        |
| Implementation | Plan approved, code being written    | `test-generator`, `domain-model-advisor`                              |
| Pre-review     | Implementation complete              | `security-auditor`                                                    |
| Review         | Pre-review passes                    | `code-reviewer` (reads ALL references)                                |
| Maintenance    | On-demand                            | `refactoring-specialist`, `migration-planner`, `documentation-writer` |

**Common Pipelines:**

| Scenario    | Agent Sequence                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| New feature | `architecture-advisor` → `domain-model-advisor` → implement → `test-generator` → `security-auditor` → `code-reviewer` |
| Bug fix     | implement → `test-generator` → `code-reviewer`                                                                        |
| Refactoring | `refactoring-specialist` → `test-generator` → `code-reviewer`                                                         |
| Upgrade     | `migration-planner` → implement → `test-generator` → `code-reviewer`                                                  |

**Invocation:** Use the Task tool to delegate to `<agent-name>` agent. Example:

```
Use the architecture-advisor agent to review the proposed component structure
```

### Available Agents

| Agent                    | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `code-reviewer`          | Review code for quality, architecture, and best practices  |
| `security-auditor`       | Scan for OWASP Top 10, secrets, and injection risks        |
| `test-generator`         | Generate Angular Testing Library tests                     |
| `documentation-writer`   | Write or update project documentation                      |
| `refactoring-specialist` | Apply SOLID/CUPID principles to improve existing code      |
| `migration-planner`      | Plan framework/library version upgrades                    |
| `architecture-advisor`   | Evaluate architecture decisions against Clean Architecture |
| `domain-model-advisor`   | Review domain models for DDD patterns and immutability     |

Agent definitions live in `.claude/agents/` (YAML frontmatter defines `name`, `description`, `tools`, and `model`). Reference files they load at runtime are in `.claude/references/`.

### Agent Reference Loading

Which `.claude/references/` files each agent loads in Step 0:

| Agent                    | References Loaded                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `code-reviewer`          | All 9 references                                                                         |
| `plan-writer`            | clean-architecture, solid, cupid, guiding-principles, cross-reference, auth, backend-api |
| `architecture-advisor`   | clean-architecture, solid, cupid, guiding-principles, cross-reference, auth, backend-api |
| `refactoring-specialist` | solid, cupid, guiding-principles                                                         |
| `domain-model-advisor`   | domain-model                                                                             |
| `test-generator`         | testing                                                                                  |
| `security-auditor`       | auth, backend-api                                                                        |
| `documentation-writer`   | —                                                                                        |
| `migration-planner`      | —                                                                                        |

### Documentation Impact Scan

**CRITICAL:** When implementation changes types, schemas, database columns, API contracts, or domain terminology, all documentation referencing those entities MUST be updated in the same commit or PR.

**What to scan:**

| Location              | What to check                                                        |
| --------------------- | -------------------------------------------------------------------- |
| `docs/`               | Architecture docs, schema references, flow descriptions              |
| `docs/api/*.bru`      | Bruno API client — request bodies, response fields, assertions, docs |
| `CLAUDE.md`           | Code examples, naming conventions, projection types                  |
| `.claude/references/` | Auth flows, backend-api patterns, domain model examples              |

**When to scan:**

- After renaming or removing a database column or table
- After changing a Zod schema or TypeScript type/interface
- After modifying API request/response shapes
- After changing enum values or status codes

**Rule:** If `git diff` shows changes to types, schemas, or database definitions, grep for the old names across documentation before committing. This prevents documentation staleness — a recurring source of review findings.

### FormField Component

`src/app/components/form-field/form-field.ts` — A wrapper component for standardized form inputs with signal forms integration. It provides label rendering, required indicator (auto-detected via `REQUIRED` metadata or manually overridden), hint text, translated validation error display, and error border styling via `aria-invalid`.

**Supported form control elements:** `input`, `select`, `textarea`

The component reads the `FormField` directive from the projected child via `contentChild(SignalFormField)` — consumers only need `[formField]` on the child element, not on `<app-form-field>` itself.

The component enforces three runtime constraints via `effect()`:

1. Only a **single direct child** may be projected into `<ng-content>`
2. The projected child must be a **supported form control**
3. The projected child must have a `[formField]` directive assigned

**When adding a new form control element type** (e.g., a custom web component), update these locations in `form-field.ts`:

| What to update                                         | Purpose                                           |
| ------------------------------------------------------ | ------------------------------------------------- |
| `ng-content select` attribute in the template          | Compile-time projection filtering                 |
| `private readonly supportedControls` class field       | Runtime validation of projected content           |
| `querySelector` selector in `afterRenderEffect()` body | `aria-invalid` attribute management               |
| `::ng-deep [aria-invalid='true']` style                | No change needed — targets attribute, not element |

---

## Automated Code Review

### Proactive Review Directive

**IMPORTANT:** After completing implementation work on any issue or feature branch, Claude MUST automatically delegate to the `code-reviewer` agent before considering the work complete.

This is a mandatory step in the workflow:

1. Complete implementation (code changes, tests, commits)
2. **Run `npm run ci`** — All CI checks must pass (exit code 0) before work is considered complete
3. **Automatically run code review** using the `code-reviewer` agent
4. Provide a report to the user, with a prioritization of all the found issues, plus the recommendations and suggestions to address them. The report must be in form of a table, that will be used to track the pending work while addressing the issues, recommendations and suggestions.
5. Save the Proactive Review results to the `workspace/CODE_REVIEW.md` file for the user to review. The user will then manually decide what to do based on the report.

### Tracking Fixes

**IMPORTANT:** When fixing issues, warnings, or suggestions from `workspace/CODE_REVIEW.md`, Claude MUST update the **Addressed** column of the corresponding row immediately after the fix is applied — before moving on to the next issue. This keeps the review report in sync with the actual state of the code.

### Local CI Verification

**CRITICAL:** Before considering any implementation work complete, `npm run ci` MUST pass with exit code 0.

The `npm run ci` command runs all CI checks serially:

1. `npm run stylelint` — CSS/style linting
2. `npm run lint` — TypeScript/ESLint linting
3. `npm run typecheck` — Type-check spec files (`tsc --noEmit`)
4. `npm run test` — Unit tests
5. `npm run test:integration` — Integration tests (requires PostgreSQL)
6. `npm run build` — Production build
7. `npm run storybook:build` — Storybook build

If any step fails, the entire command fails. Fix all issues before proceeding to code review.

### When to Trigger

Claude should proactively invoke the code-reviewer agent when:

- All planned commits for an issue are complete
- User says "done", "finished", "ready for review", or similar
- User asks to create a PR (review first, then PR)
- Implementation phase of plan mode is complete

### How to Invoke

Use the Task tool to delegate to the code-reviewer agent:

```
Use the code-reviewer agent to review the changes on this branch
```

### Review Scope

The code-reviewer agent checks:

- **Hard constraints** — Function/file length, complexity, no console.log, no untyped any
- **SOLID principles** — Single responsibility, dependency inversion, etc.
- **CUPID principles** — Composable, predictable, idiomatic code
- **Domain patterns** — Immutability, factory functions, Zod validation
- **Test coverage** — Tests exist for new code, follow Angular Testing Library patterns
- **Documentation currency** — Docs, Bruno files, and CLAUDE.md updated when schemas/types/API contracts change

### Workflow Integration

```
┌─────────────────┐
│  Planning       │ ◄── Delegation to plan-writer agent → workspace/PLAN.md
│   (optional)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Implementation │
│   (commits)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  npm run ci     │ ◄── MUST pass with exit code 0
│   (mandatory)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  npm run ci     │ ◄── MUST pass with exit code 0
│   (mandatory)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Code Review    │ ◄── Delegation to code-reviewer agent → workspace/CODE_REVIEW.md
│   (mandatory)   │
└────────┬────────┘
         │
         ▼
┌───────────────────────────┐
│  Prioritization and       │ ◄── User manually decides what to do based on review report
│  manual mandatory review  │
└────────┬──────────────────┘
         │
         ▼
┌─────────────────┐
│  Fix Issues     │ (if any critical/warnings)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Ready for PR   │
└─────────────────┘
```

---

_Last updated: 2026-03-03_
