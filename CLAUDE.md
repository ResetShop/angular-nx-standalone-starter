# Project Guidelines

> **Purpose:** This document provides coding standards, architectural principles, and tooling guidelines for this project. Claude Code should follow these guidelines when generating, reviewing, or modifying code.

> **Coding agent collaboration policies:** All AI coding agents operating on this repo MUST also follow [`.claude/references/coding-agent-policies.md`](.claude/references/coding-agent-policies.md), and **must load that file at the start of every session, before generating any recommendations**. The policies are a hard constraint at the same level as the constraints in this CLAUDE.md file. Banned recommendation patterns are review-blocking. See in particular Section 1 (no-solo-maintainer rule) and Section 2 (other shortcut anti-patterns).

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
10. [Environment Variables](#environment-variables)
11. [Development Workflow](#development-workflow)
12. [Automated Code Review](#automated-code-review)

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

| Command                    | Description                                                                       |
| -------------------------- | --------------------------------------------------------------------------------- |
| `npm install`              | Install dependencies                                                              |
| `npm run ci`               | Run all CI checks **cold** (`--skip-nx-cache`) — authoritative final gate         |
| `npm run ci:verify`        | Run all CI checks **cache-aware** (Nx local cache) — intermediate/inner-loop runs |
| `npm run build`            | Build the project                                                                 |
| `npm run dev`              | Start development server                                                          |
| `npm run format`           | Format all files with Prettier                                                    |
| `npm run format:check`     | Check formatting without writing                                                  |
| `npm run lint`             | Run linting                                                                       |
| `npm run storybook`        | Run storybook dev server                                                          |
| `npm run storybook:build`  | Build storybook                                                                   |
| `npm run stylelint`        | Run stylelint                                                                     |
| `npm run typecheck`        | Type-check spec files (tsc --noEmit)                                              |
| `npm run test`             | Run all unit tests                                                                |
| `npm run test:integration` | Run backend integration tests (requires DB)                                       |
| `npm run test:e2e`         | Run all end-to-end tests                                                          |
| `npm install <pkg>`        | Add a dependency                                                                  |
| `npm install -D <pkg>`     | Add a dev dependency                                                              |
| `npm install -g <pkg>`     | Add a global dependency                                                           |

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

### Canonical App Creation Workflow

`apps/reference-app` is the **canonical template** and is upstream-owned. It must never be modified by forks and never renamed. It is the only source from which new apps are generated.

To create a new app, always use the schematic:

```
npm run generate:app -- --name="My App"
```

The schematic clones `apps/reference-app` into `apps/<slug>` (where `<slug>` is the kebab-case slug derived from the human-readable name) and rewrites every `reference-app` reference inside the copied files to the new slug. The `<title>` in `index.html` is set to the human-readable display name.

**Never** create a new app by hand-copying `apps/reference-app`, scaffolding from `nx g @nx/angular:application`, or modifying `apps/reference-app` directly. The fork-based distribution model depends on this contract. See [`docs/forking.md`](docs/forking.md) for the full workflow documentation.

### Folder Structure Conventions

```
apps/
  └── reference-app/    # Canonical example app (and source for the schematic)
       └── src/
            ├── api/         # Hono backend (modules, middleware, services, helpers)
            ├── app/         # Angular frontend (pages, components, store, providers)
            ├── contracts/   # Shared Zod schemas + TypeScript types
            └── db/schema/   # Drizzle table schemas
packages/
  ├── util/             # Pure functions, helpers, types — framework-free
  ├── ui/               # Presentational Angular components + Storybook stories
  ├── angular-core/     # Shared Angular providers (i18n, theme, navigation, logger)
  ├── hono-core/        # Hono backend infrastructure (createOpenAPIApp, isServerless)
  └── generators/       # Nx generators (store, api-provider, backend-module, page, crud, drizzle-schema, app)
```

All `packages/*` are exposed via `@resetshop/*` path aliases in `tsconfig.base.json`. App-scoped aliases live in `apps/reference-app/tsconfig.json` and currently include `@components/*`, `@configs/*`, `@contracts/*`, `@directives/*`, `@domain/*`, `@guards/*`, `@pages/*`, `@providers/*`, `@schema/*`, and `@store/*`. Refer to that file for the authoritative list.

### Naming Conventions

- **Files:** `kebab-case` (e.g., `user-profile.component.ts`)
- **Classes:** `PascalCase` (e.g., `UserProfileComponent`)
- **Interfaces:** `PascalCase`, no `I` prefix. Use the **Qualified Implementation** naming convention: the interface owns the clean name, implementations use a technology/purpose prefix. Domain model interfaces keep the `I` prefix only where a runtime class exists (e.g., `IUser`/`User`). DTOs and general interfaces never use a prefix (e.g., `CreateRoleParams`).
- **Functions/Methods:** `camelCase` (e.g., `getUserById`)
- **Constants:** `SCREAMING_SNAKE_CASE` for true global constants; `camelCase` for local constants

### Scope Rules for Constants and Variables

- **Local constants:** Keep inside the function scope when used by a single function. Declare them as close as possible to the point of evaluation — never at the top of a file when the only usage is deep inside a single function
- **Module constants:** Promote to module level only when shared across multiple functions in the same file
- **Global constants:** Use only after analysis confirms reuse across multiple files

**Default is local scope.** When writing code, fixing issues, or suggesting improvements, always prefer a local `const` over a module-level declaration. Never introduce a module-level variable or constant as part of a fix when the value is only consumed by a single function — use an inline literal or a function-scoped `const` instead.

**Rationale:** A constant declared 50+ lines away from its single usage forces the reader to scroll and mentally link two distant locations. Co-locating the constant with its usage, when the usage is single, makes the code self-contained and easier to follow.

### Code Comment Quality

Code comments document the **present-state intent and rationale** of the code — _what it does and why it must be this way now_ — never the history of how it got there. A comment must stand on its own for a reader six months from now who has no access to the issue tracker.

**Forbidden in `.ts`, `.spec.ts`, `.stories.ts`, and generator template files:**

- **Issue/PR number tokens** (`#499`, `(see #468)`, `regression guard for #471`). The change-narrative — why it changed, what it replaced, the issue/PR cross-references — belongs in the **PR description and its issue thread** (with `CHANGELOG.md` carrying the fork-facing summary and `git log` / `git blame` the "when/who"). A comment documents the present invariant; **PRs and issues are the canonical home for the change-narrative.**
- **Before/after-issue framing** (`Since #497 the hasher reads…`, `Pre-#331 this was camelCase`, `#480 removed the unreachable link`). Write the invariant, not the diff against a past state that no longer exists in the tree.
- **"Formerly X" / "moved here from" framing** (`moved here from the former auth.env.ts`). Describe what the code is now, not what it used to be.

**A regression-guard comment is still welcome — describe the invariant in plain English instead of citing a number:**

```typescript
// ❌ Issue-number reference + before/after framing
// Regression guard for sub-issue #344 item 8. The CRUD drawer overrides went from
// `class="lg:w-lg"` to `class="w-full sm:w-lg"`.

// ✅ Present-state invariant
// Regression guard for the CRUD drawer responsive width classes. The panel must be
// full-width below the `sm:` breakpoint and pinned to 512 px from `sm:` up (`w-full sm:w-lg`).
```

**Exempt:**

- `CHANGELOG.md` entries **should** reference issues — that is their job.
- `docs/`, `README.md`, `CLAUDE.md`, and `.claude/references/` may use **hyperlinked** issue references (`[#499](…)`) as durable cross-references where genuinely useful — prefer durable descriptions over bare `#<n>` tokens.

Enforced by `scripts/check-no-issue-refs-in-comments.mjs` (pre-commit hook + both `npm run ci` / `npm run ci:verify`), which fails the build on any `#<n>` token (any length) in a `.ts` or generator `.ts.template` comment — including `//` line comments and `/* … */` block comments.

---

## Hard Constraints

These are non-negotiable rules. Violations require explicit justification.

| Constraint                              | Limit                                                                                                                                                                                                                                                                                                                                                               | Rationale                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Function length                         | ≤ 50 lines                                                                                                                                                                                                                                                                                                                                                          | Readability, SRP                        |
| File length                             | ≤ 500 lines (spec files exempt)                                                                                                                                                                                                                                                                                                                                     | Maintainability                         |
| Cyclomatic complexity                   | ≤ 10                                                                                                                                                                                                                                                                                                                                                                | Testability                             |
| Nesting depth                           | ≤ 3 levels                                                                                                                                                                                                                                                                                                                                                          | Readability                             |
| Barrel imports/exports                  | Not allowed in any part of the project                                                                                                                                                                                                                                                                                                                              | Maintainability, Performance            |
| `any` type                              | Forbidden without `// REASON:` comment                                                                                                                                                                                                                                                                                                                              | Type safety                             |
| `// @ts-ignore`                         | Forbidden without linked issue                                                                                                                                                                                                                                                                                                                                      | Technical debt tracking                 |
| `console.log`                           | Remove before commit                                                                                                                                                                                                                                                                                                                                                | Clean code                              |
| TypeScript enums                        | Forbidden - use `Object.freeze()` instead                                                                                                                                                                                                                                                                                                                           | Consistency, type safety                |
| Type-only imports                       | Use `type` keyword for types/interfaces when only used in the context of type annotations                                                                                                                                                                                                                                                                           | Bundle size, clarity                    |
| Raw time literals                       | Forbidden — use duration strings (`'15m'`, `'1h'`, `'7d'`) resolved via `parseDurationToMs()` / `parseDurationToSeconds()`                                                                                                                                                                                                                                          | Readability, consistency                |
| `vi.fn()`/`vi.mock()`                   | Forbidden — use `fn()` from `@test-utils`; ESLint enforced                                                                                                                                                                                                                                                                                                          | Framework independence                  |
| `firstValueFrom`/`toPromise`            | Forbidden in Angular frontend (`src/app/`) — use `rxMethod` from `@ngrx/signals/rxjs-interop` instead                                                                                                                                                                                                                                                               | Signals-first, no promises              |
| `Translation.instant` in `packages/ui/` | Must supply an English fallback as the 2nd arg (`instant(key, fallback)`). Verbatim from `en.ts`. Required for every call site in `packages/ui/src/lib/**/*.ts`; not required in `apps/*` or `packages/angular-core/`                                                                                                                                               | Storybook-renderable library components |
| `TestBed.flushEffects()`                | Deprecated since Angular 20 — use `TestBed.tick()` instead                                                                                                                                                                                                                                                                                                          | API deprecation                         |
| Storybook stories                       | Every new UI component in `src/app/components/` must include a `*.stories.ts` file                                                                                                                                                                                                                                                                                  | Visual testing, documentation           |
| External repo issues                    | Never create issues on repos where the user is not a contributor — inform the user and let them create it themselves                                                                                                                                                                                                                                                | Ownership, etiquette                    |
| Permission string literals              | Every file using permission identifier strings must have a test validating them against `PERMISSION_DEFINITIONS`                                                                                                                                                                                                                                                    | Catches typos, stale refs               |
| Coding agent recommendation framing     | All AI agents must follow [`.claude/references/coding-agent-policies.md`](.claude/references/coding-agent-policies.md). No solo-maintainer shortcut framings, no "skip the test for this small change", no deferring code review past PR open. Review-blocking.                                                                                                     | Multi-collaborator showcase precedent   |
| Issue/PR refs in code comments          | Forbidden in `.ts`/`.spec.ts`/`.stories.ts`/generator `.ts.template` files — comments state present-state rationale only. No `#<n>` tokens (any length), no "before/after `<issue>`" framing, no "formerly X". `CHANGELOG.md` and `docs/` are exempt. Enforced by `scripts/check-no-issue-refs-in-comments.mjs`. See [Code Comment Quality](#code-comment-quality). | Code longevity, readability             |

### Object.freeze() Instead of Enums

TypeScript enums are forbidden in this project. Use `Object.freeze()` with `as const` for key/value references instead.

```typescript
// ✅ Correct - using Object.freeze()
export const AuthErrorCode = Object.freeze({
	INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
	ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
	ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
} as const)

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode]

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
import type { User } from './user.interface'
import { type IUserRepository, type UserDTO } from './user.types'
import { UserService } from './user.service' // No type keyword - used at runtime

// ❌ Incorrect - missing type keyword for type-only imports
import { User, IUserRepository } from './user.types'
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
export const REFRESH_TOKEN_EXPIRY_BUFFER = '1h'

// In repository:
const cutoffTime = new Date(Date.now() - parseDurationToMs(REFRESH_TOKEN_EXPIRY_BUFFER))

// ❌ Incorrect — raw millisecond literal
export const REFRESH_TOKEN_EXPIRY_BUFFER_MS = 3600000

// ❌ Incorrect — computed expression
export const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000

// ❌ Incorrect — suffix encodes the unit
export const HEALTH_CHECK_TIMEOUT_MS = 5000
```

**Existing compliant constants (reference as established pattern):**

| Constant                       | File                                         | Value   |
| ------------------------------ | -------------------------------------------- | ------- |
| `DEFAULT_LOCKOUT_DURATION`     | `src/api/constants/auth.constants.ts`        | `'15m'` |
| `DEFAULT_ACCESS_TOKEN_EXPIRY`  | `src/api/constants/auth.constants.ts`        | `'15m'` |
| `DEFAULT_REFRESH_TOKEN_EXPIRY` | `src/api/constants/auth.constants.ts`        | `'7d'`  |
| `REFRESH_TOKEN_EXPIRY_BUFFER`  | `src/api/constants/auth.constants.ts`        | `'1h'`  |
| `HEALTH_CHECK_TIMEOUT`         | `src/api/modules/health/health.constants.ts` | `'5s'`  |

### Translation Fallbacks in Reusable UI Components

Components in `packages/ui/src/lib/` are reusable across apps and Storybook stories. Storybook does **not** wire `provideTranslation()` — stories render with the empty default loader, and `Translation.instant(key)` returns the raw key. To keep stories (and any other consumer that doesn't wire translations) rendering meaningful text, every `instant(key)` call inside `packages/ui/src/lib/**/*.ts` MUST pass an English fallback as the second argument.

The fallback is silently overridden whenever a translation is actually loaded — apps wired with `provideTranslation()` still receive localized strings. The fallback only takes effect when `Translation.instant()` cannot resolve the key.

```typescript
// ✅ Correct — fallback supplied
protected readonly label = this.translation.instant('PAGINATION.LABEL', 'Pagination')

protected readonly pageOfTemplate = this.translation.instant('PAGINATION.PAGE_OF', 'Page {current} of {total}')

case 'minLength':
	return this.translation
		.instant('VALIDATION.MIN_LENGTH', 'Must be at least {min} characters')
		.replace('{min}', String(error.minLength))

// ❌ Incorrect — Storybook renders the literal string 'PAGINATION.LABEL'
protected readonly label = this.translation.instant('PAGINATION.LABEL')
```

**Rules:**

1. **Verbatim from `en.ts`.** Fallback strings must be exact copies of the English entries in `apps/reference-app/src/app/providers/i18n/translations/en.ts`. Any divergence means production users in English see one string while Storybook viewers see another.
2. **Keep interpolation placeholders intact.** Interpolated keys retain their `{page}`, `{current}`, `{total}`, `{min}`, `{max}` tokens — existing `.replace(...)` calls work identically on the fallback path with no branching.
3. **Inline, not abstracted.** Do not introduce intermediate `*_KEYS` / `*_DEFAULTS` frozen objects or per-component `resolved()` helpers — they add indirection for no DRY win and have been explicitly removed (see PR #372). The string literal lives once at the call site.
4. **Fallback-path test per translated string.** Every translated string in a `packages/ui` component must have a dedicated test that replaces the `Translation` provider with `{ instant: (key, fallback) => fallback ?? key }` and asserts the rendered English fallback. See `packages/ui/src/lib/{pagination,data-table,form-field}/*.spec.ts` for the canonical pattern.
5. **No `Translate.instant` wrappers.** The previous `resolveOrDefault` helper has been deleted. `Translation.instant(key, fallback)` is now the only sanctioned API for resolution-with-fallback.

**Scope — where this rule does NOT apply:**

- `apps/*/src/app/` — apps always wire `provideTranslation()`, so a fallback would be dead code. Existing call sites use the single-arg `instant(key)` form and should stay that way.
- `packages/angular-core/` — internal helpers (`TranslatePipe`, `NavigationTitleStrategy`) are consumed inside apps and don't need fallbacks. Tests mock `Translation` directly.

**Dev warnings:**

`Translation.instant()` emits a deduplicated `logger.warn('Translation', 'Missing translation for "X" in language "Y"')` for every unresolved key in `isDevMode()`. The warning fires **even when a fallback is supplied** — a missing key is information the developer should always see. Repeated raw-key warnings during dev are a signal that either (a) a `packages/ui` call site is missing a fallback, or (b) a key is genuinely absent from `en.ts`/`es.ts` and needs to be added.

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
          error: (err) => {
            logger.error('UsersStore', 'createUser failed', err);
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
store.loadUsers(store.listParams)

// ✅ Imperative — pass the current value (static), triggers a one-shot fetch
store.loadUsers(store.listParams())

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
	list: string | null
}
export interface UsersMutationError {
	create: string | null
	update: string | null
	delete: string | null
}

// ❌ Incorrect — single shared error field
readError: string | null
mutationError: string | null
```

Helper functions `patchReadError` / `patchMutationError` in each store handle type-safe error patching. Computed signals `hasReadError` / `hasMutationError` provide boolean checks for the UI. Every error handler must log via `logger.error(storeName, 'methodName failed', err)` (inject `Logger` token from `@providers/logger/logger.token`).

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
let apiMock: Record<keyof UsersApi, MockFn>;

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

**Route-level store registration:**

Domain stores keep `providedIn: 'root'` for tree-shaking, but must be **explicitly provided** at the route level alongside their API token dependencies. `providedIn: 'root'` is a default — when you explicitly provide a `providedIn: 'root'` service in a route's `providers` array, Angular creates it in that route's `EnvironmentInjector` instead of the root injector. All `inject()` calls inside the store factory then resolve from that route's injector, where the API tokens are available.

```typescript
// ✅ Correct — store and API token co-provided at the route level
{
  path: 'users',
  loadComponent: () => import('./users/users-list/users-list'),
  providers: [provideUsers(), provideRoles(), UsersStore, RolesStore],
}

// ❌ Incorrect — store not listed, relies on root injector where API token is missing
{
  path: 'users',
  loadComponent: () => import('./users/users-list/users-list'),
  providers: [provideUsers(), provideRoles()],
}
```

**Rules:**

- Every route that uses a domain store must list both `provideX()` and the store in its `providers` array
- `AuthStore` and `UIStore` are exceptions — their dependencies (`AuthApi`) are provided at root in `app.config.ts`, so they don't need route-level registration
- Never remove `providedIn: 'root'` from stores — it enables tree-shaking and serves as a fallback when no explicit provider is given

**Eager instantiation of root singletons at route level:**

Some `providedIn: 'root'` services (e.g., `ToastBridgeService`) rely on constructor side effects (`effect()`) that must be active before the route's components fire notifications. Because `providedIn: 'root'` services are instantiated lazily on first injection, a service that is never injected by any component stays dormant. Use `provideEnvironmentInitializer(() => inject(Service))` in the route's `providers` array to force instantiation when the route activates.

`provideToast()` is the canonical example. `ToastBridgeService` and `NgpToastManager` are both `providedIn: 'root'` singletons (the manager renders into `document.body`, so where it is provided is irrelevant), and `ToastBridgeService` passes its presentation options per `show()` — so **no `NgpToastConfig` is registered anywhere**, and nothing toast-related is forced onto routes that never show toasts. `provideToast()` therefore provisions **nothing new** — it is exactly `provideEnvironmentInitializer(() => inject(ToastBridgeService))`, which eagerly instantiates the single root bridge so its `effect()` is live for that route. The `inject()` resolves up to the one root instance (no route re-provides it), so every route that calls `provideToast()` shares the same bridge and a notification renders exactly once. Put it on each route that fires toasts; routes that fire none add nothing.

```typescript
// ✅ Correct — provideToast() on each route that fires toasts; it only activates the single root-singleton
// ToastBridgeService (no new instance). Routes that fire no toasts (settings, health, …) add nothing.
{
  path: 'users/:id',
  providers: [provideUsers(), provideRoles(), UsersStore, RolesStore, provideToast()],
}

// ❌ Incorrect — listing NgpToastManager / ToastBridgeService as classes in a route's providers mints a
// route-scoped instance that overrides the root singleton; multiple live bridges each render the SHARED
// UIStore notifications, so a denied deep-link of a parameterized route duplicates the deny toast (#471)
{
  path: 'users/:id',
  providers: [provideUsers(), NgpToastManager, ToastBridgeService /* ← wrong */],
}
```

**Rules:**

- Add `provideToast()` to each route that fires toasts. It is activation-only (it just eagerly injects the root `ToastBridgeService`), so calling it on many routes still yields **one** shared bridge — no duplication ([#471](https://github.com/ResetShop/angular-nx-standalone-starter/issues/471)).
- Never list `ToastBridgeService` or `NgpToastManager` as a class in any route's `providers` — that mints a route-scoped instance, overriding the root singleton, and resurrects the duplicate-toast bug.
- Do **not** register `provideToastConfig` (it would have to live at app root for the root-singleton manager to read it, leaking toast config onto every route). Per-toast presentation defaults live in `DEFAULT_TOAST_OPTIONS` (`components/toast/toast.config.ts`) and are spread into `NgpToastManager.show()` by `ToastBridgeService` — that is the one place to tune `placement` / `dismissible`. Container-only settings the manager reads from its config token (`maxToasts`, `gap`, `zIndex`) are **not** expressible per `show()` and use ng-primitives' defaults (`maxToasts` is already 3); changing them is the only thing that would require a root `provideToastConfig`.
- The initializer resolves from the root injector (where `providedIn: 'root'` registered the singleton), so no new instance is created.
- As a `providedIn: 'root'` singleton the bridge persists for the session once first activated. A toast can also be fired from a route that never calls `provideToast()` — a 403 handled by `forbiddenInterceptor` on any page. The interceptor activates the bridge on demand (`injector.get(ToastBridgeService)` inside its 403 branch) so the toast renders anywhere, without keeping the bridge always-on app-wide ([#480](https://github.com/ResetShop/angular-nx-standalone-starter/issues/480)).

**Current route registrations (`dashboard.routes.ts`):**

| Route                       | Providers                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `dashboard` (shell)         | `provideNavigation()`, `provideNavigationConfig(dashboardNavigationConfig)`                  |
| `users`                     | `provideUsers()`, `provideRoles()`, `UsersStore`, `RolesStore`, `provideToast()`             |
| `users/:id`                 | `provideUsers()`, `provideRoles()`, `UsersStore`, `RolesStore`, `provideToast()`             |
| `authorization/permissions` | `providePermissions()`, `PermissionsStore`                                                   |
| `authorization/roles`       | `provideRoles()`, `providePermissions()`, `RolesStore`, `PermissionsStore`, `provideToast()` |

---

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

- `type:*` — `type:app`, `type:ui`, `type:angular-core`, `type:hono-core`, `type:util` (and `type:data-access`, `type:backend`, `type:contracts` if reintroduced)
- `scope:starter` — all upstream-owned projects (`packages/*` and `apps/reference-app`). May only depend on other `scope:starter` projects, enforced by `@nx/enforce-module-boundaries`.
- `scope:app` — all fork-generated apps (created by `@resetshop/generators:app`). May depend on both `scope:starter` and `scope:app`. The schematic emits this tag automatically when cloning `apps/reference-app`.

**Generators:**

The starter ships seven Nx generators under `@resetshop/generators` that emit
boilerplate following project conventions. Prefer them over hand-rolling the
equivalent files.

```bash
# Create a new app via the schematic (the only supported path; see Canonical
# App Creation Workflow above for details)
npm run generate:app -- --name="My App"

# Add a full vertical slice (DB + API + provider + store + page) for an entity
nx g @resetshop/generators:crud product --module=catalog

# Or invoke any single-layer generator directly:
nx g @resetshop/generators:drizzle-schema product
nx g @resetshop/generators:backend-module product --module=catalog
nx g @resetshop/generators:api-provider product
nx g @resetshop/generators:store product
nx g @resetshop/generators:page product --withStore --withApiProvider
```

For the decision tree (when to use which generator), per-generator file lists,
known limitations, and the executable specs, see [`.claude/references/generators.md`](.claude/references/generators.md).
The README also has a shorter human-facing summary under "Generators".

**Do not** call `nx g @nx/angular:library --directory=libs/...` — this
repository uses the `packages/*` + `apps/reference-app` layout, not the Nx
libs convention.

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
- **Frontend components require Storybook stories** — every new component in `src/app/components/`, or any component whose inputs, visual states, or public API change, must have a corresponding `*.stories.ts` file. See `.claude/references/testing.md` for story conventions.

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

- `protected` for all fields and methods used only in the component's own template
- `private` for internal fields and methods not referenced in any template
- `public` for **signal inputs/outputs/models** (`input()`, `output()`, `model()`) — these are the component's external API consumed by parent templates
- `public` for **imperative API methods** called by parents via `viewChild` / `componentInstance` (e.g., `open()`, `close()`, `show()`, `setContentReady()`)
- `public` for **interface-required members** (e.g., `ngOnDestroy`, `FormValueControl.value`)
- Never use `public` on internal fields that are only consumed within the component itself

### Effect Field Initializers

All `effect()`, `afterRenderEffect()`, and `afterNextRender()` calls must be declared as **named class field initializers** — never inside constructor bodies. Field initializers in Angular-decorated classes (`@Component`, `@Injectable`, `@Directive`) run in injection context, making the constructor unnecessary for registering reactive effects.

```typescript
// ✅ Correct — effect as named field initializer
export class MyComponent {
	private readonly store = inject(MyStore)

	private readonly syncEffect = effect(() => {
		const value = this.store.someSignal()
		untracked(() => this.doSomething(value))
	})
}

// ❌ Incorrect — effect inside constructor
export class MyComponent {
	private readonly store = inject(MyStore)

	constructor() {
		effect(() => {
			const value = this.store.someSignal()
			untracked(() => this.doSomething(value))
		})
	}
}
```

**Rules:**

- Effect fields must use descriptive names (e.g., `syncCodeEffect`, `closeOnSuccessEffect`, `deleteToastEffect`)
- Fields referenced by the effect must be declared **before** the effect field in class body order
- Constructor bodies should not contain effect registrations
- Conditional effects (e.g., dev-mode only) use a ternary: `private readonly validateGroupingEffect = isDevMode() ? effect(() => { ... }) : undefined`

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
	id: number
	email: string
	firstName: string
	lastName: string
	status: UserStatus
	statusChangedAt: Date | null
	statusChangedBy: number | null
	deletedAt: Date | null
	createdAt: Date | null
	updatedAt: Date | null
}
```

**Rules:**

- Use `Projection` suffix to distinguish from domain types (`UserData`, `RoleData`)
- Keep file-local (not exported) — these are internal to the repository
- Extract when a query result type is used in method signatures or appears inline with 3+ fields
- Inline anonymous types in Drizzle `.select()` calls are fine — the `Projection` type captures the output shape when passed between methods

### Frontend API Provider Pattern

API tokens are plain `InjectionToken` instances with **no** `providedIn` / `factory`. The wiring happens exclusively through `provideX()` functions that return `EnvironmentProviders` via `makeEnvironmentProviders()`, preventing component-level registration.

```typescript
// 1. Interface + token (e.g., auth.interface.ts) — no factory, no providedIn
export interface AuthApi {
	login(params: LoginRequest): Observable<LoginResponse>
	// ...
}
export const AuthApi = new InjectionToken<AuthApi>('AuthApi')

// 2. HTTP implementation (e.g., auth.ts) — providedIn: 'root' for tree-shaking
@Injectable({ providedIn: 'root' })
export class HttpAuthApi implements AuthApi { ... }

// 3. Provider function (e.g., auth.provider.ts) — environment-only registration
export function provideAuth() {
	return makeEnvironmentProviders([{ provide: AuthApi, useExisting: HttpAuthApi }])
}

// 4a. Root registration (app.config.ts) — auth only, called once at bootstrap
providers: [provideAuth()]

// 4b. Route-level registration (dashboard.routes.ts) — domain providers co-located with their stores
{ path: 'users', providers: [provideUsers(), provideRoles(), UsersStore, RolesStore] }

// 5. Consumer (e.g., auth.store.ts)
const authApi = inject(AuthApi) // resolves via provideAuth() registration

// 6. Mock provider function (e.g., auth.mock.ts) — same EnvironmentProviders pattern
export function provideAuthMock(api: InMemoryAuthApi = new InMemoryAuthApi()) {
	return makeEnvironmentProviders([{ provide: AuthApi, useValue: api }])
}

// 7. Test usage
providers: [provideAuthMock()]
```

**Rules:**

- `InjectionToken` declarations must **not** include `providedIn` or `factory` — use `provideX()` instead
- `Http*Api` classes keep `@Injectable({ providedIn: 'root' })` for tree-shaking
- Provider functions return `EnvironmentProviders` (never `Provider[]`) to enforce environment-only registration
- Mock provider functions follow the same `makeEnvironmentProviders` pattern
- ESLint `no-restricted-imports` blocks direct API token imports in `src/app/pages/` and `src/app/components/` — components must inject via stores or guards

**Existing provider functions:**

| Function               | File                                  | Registers                               | Scope                         |
| ---------------------- | ------------------------------------- | --------------------------------------- | ----------------------------- |
| `provideAuth()`        | `auth/auth.provider.ts`               | `AuthApi` → `HttpAuthApi`               | Root (`app.config.ts`)        |
| `provideUsers()`       | `users/users.provider.ts`             | `UsersApi` → `HttpUsersApi`             | Route (`dashboard.routes.ts`) |
| `provideRoles()`       | `roles/roles.provider.ts`             | `RolesApi` → `HttpRolesApi`             | Route (`dashboard.routes.ts`) |
| `providePermissions()` | `permissions/permissions.provider.ts` | `PermissionsApi` → `HttpPermissionsApi` | Route (`dashboard.routes.ts`) |

**Mock provider functions:**

| Function                   | File                              |
| -------------------------- | --------------------------------- |
| `provideAuthMock()`        | `auth/auth.mock.ts`               |
| `provideUsersMock()`       | `users/users.mock.ts`             |
| `provideRolesMock()`       | `roles/roles.mock.ts`             |
| `providePermissionsMock()` | `permissions/permissions.mock.ts` |

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
			return throwError(() => error)
		}),
	)
}
```

---

## Domain Model Guidelines

> Full domain model guidelines: See `.claude/references/domain-model.md`

---

## Environment Variables

**The repo's contract:** every backend env variable is declared in one of the eight domain-scoped Zod sub-schemas under `apps/reference-app/src/api/config/*.env.ts` (`db`, `email`, `http`, `app`, `cron`, `token`, `password`, `security`) and consumed exclusively as `<domain>Env.VAR_NAME` (e.g., `dbEnv.PG_CONNECTION_STRING`, `tokenEnv.PASETO_SECRET_KEY`) via the `@config/*` path alias. Direct `process.env[...]` access is **ESLint-forbidden** in production code (a `no-restricted-syntax` rule in `eslint.config.mjs`; the allowlist is an explicit per-file list (no directory wildcards): the `createEnvHandler` factory `env-utils.ts` and its spec, `config/runtime.ts` (the `isInteractive()` helper, reading `CI`/`isTTY`) and its spec, `apps/**/src/test-setup.ts`, the integration setup's `global-setup.ts` (cross-process `PG_TEST_CONNECTION_STRING` handoff) and `env-helpers.ts` (the `.env` delivery boundary + `seed<Domain>Env` fixtures), and the `db/seed.ts` entry-point — every other file must consume config via the `<domain>Env` proxies or their `seed<Domain>Env` test helpers).

**Why eight modules instead of one:** the original monolithic `env.ts` mixed unrelated concerns (DB strings, PASETO keys, SMTP settings, cron schedules) in a single Zod object, which forced consumers to import a giant type even when they only needed `PORT`. The multi-module split aligns the schema with the bounded contexts that consume it — token config (`token`) holds the only required fields (`PASETO_SECRET_KEY` / `PASETO_ISSUER`), kept separate from password-hashing (`password`), lockout/rate-limit (`security`), and cron (`cron`) config, so a hashing- or lockout-only consumer never triggers PASETO validation; the shared lazy-init / cache / seed / reset behavior lives once in `createEnvHandler` (see `env-utils.ts`) so each sub-schema is a ~30-line declaration of fields + a one-line factory call.

**The repo's non-contract:** how each developer delivers values to `process.env` before `node` starts is left to them. The four supported delivery mechanisms — out-of-tree env file + Node `--env-file`, IDE run configuration, shell session export, and `direnv` — are documented in [`docs/environment-variables.md`](docs/environment-variables.md). **No `.env*` file may exist in the working tree;** `scripts/check-no-env-files.mjs` runs from the pre-commit hook and from the `check` Nx target (part of both `npm run ci` and `npm run ci:verify`), failing if one appears. This is the structural defense against agents opportunistically reading `.env*` files; the `.claude/settings.json` deny rules add a second layer that blocks AI agents from reading, writing, editing, or shell-creating `.env*` files.

**Adding or changing a variable:**

1. Open the appropriate sub-schema (`apps/reference-app/src/api/config/<domain>.env.ts`).
2. Add the field to its Zod schema with the appropriate validation, default, and `.catch()` tolerance.
3. If the field is required at boot but has a sane test stub, add it to the `testDefaults` argument of `createEnvHandler`.
4. Add a row to the Variable Index table in [`docs/environment-variables.md`](docs/environment-variables.md).
5. Consume the value via `<domain>Env.NEW_VAR` — never `process.env['NEW_VAR']`.
6. Add a spec case to `<domain>.env.spec.ts` covering the new field's validation behavior.
7. Do **not** create or commit a `.env*` file.

For values that need to be mockable in tests (e.g. `CRON_SECRET` in the cleanup-tokens endpoint), follow the `AuthConfig` / `PasetoConfig` pattern: extract a typed config interface, register it as a frozen value in the Awilix container, and inject it into the consuming service. The env proxies are read once on first access; tests that need different values per case must consume them via DI, not via `process.env` mutation.

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

**Branch model:** day-to-day feature branches are created from `develop` (the integration branch and GitHub default) and PRs target `develop`. `main` is the protected, release-only branch — it advances exclusively via the automated `develop → main` release PR created by `prepare-release-pr.yml`, and merging that PR triggers `release.yml` (tag + GitHub Release). Hotfixes are the one exception: they branch off `main` directly, PR back to `main` (with a version bump), and are back-merged `main → develop` afterwards. Releases are prepared with the `/release-workflow` skill. Full mechanics: [`docs/release-process.md`](docs/release-process.md).

### Agent Orchestration

Use the Task tool to delegate to specialized agents at each development phase:

| Phase          | Trigger                              | Agents                                                                |
| -------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Planning       | New feature/component/module/service | `architecture-advisor` ∥ `domain-model-advisor` (parallel)            |
| Implementation | Plan approved, code being written    | `test-generator` ∥ `domain-model-advisor` (parallel — write-disjoint) |
| Pre-review     | Implementation complete              | `test-generator` ∥ `security-auditor` (parallel)                      |
| Review         | Pre-review passes                    | `code-reviewer` (reads ALL references)                                |
| Maintenance    | On-demand                            | `refactoring-specialist`, `migration-planner`, `documentation-writer` |

**Common Pipelines** (`∥` = run in parallel; `→` = sequential):

| Scenario    | Agent Sequence                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| New feature | (`architecture-advisor` ∥ `domain-model-advisor`) → implement → (`test-generator` ∥ `security-auditor`) → `code-reviewer` |
| Bug fix     | implement → `test-generator` → `code-reviewer`                                                                            |
| Refactoring | `refactoring-specialist` → `test-generator` → `code-reviewer`                                                             |
| Upgrade     | `migration-planner` → implement → `test-generator` → `code-reviewer`                                                      |

**Parallel vs sequential:** Advisors that are independent — no data dependency on each other and **no shared write target** — run concurrently in a single message with multiple `Agent` calls. Two such groups exist: the planning advisors (`architecture-advisor` ∥ `domain-model-advisor`) and the pre-review advisors (`test-generator` ∥ `security-auditor`). Keep agents **sequential** when one consumes another's output or when they would write to the same file (e.g. both editing the same `workspace/*.md` artifact such as `workspace/PLAN.md` or `workspace/CODE_REVIEW.md`); the correctness rule is _no shared write target_. The `/issue-workflow` skill's own phase pauses (after Plan, after Review) remain sequential by design — parallelization applies only to the intra-phase advisor fan-out.

**Invocation:** Use the Task tool to delegate to `<agent-name>` agent.

- Sequential (single agent): `Use the architecture-advisor agent to review the proposed component structure`
- Parallel group, planning (issue both `Agent` calls in **one** message): `Use the architecture-advisor and domain-model-advisor agents in parallel to review the planned module` — the two run concurrently because neither depends on the other and they share no write target.
- Parallel group, pre-review (same one-message pattern): `Use the test-generator and security-auditor agents in parallel on this branch` — `test-generator` writes `*.spec.ts` files while `security-auditor` is read-only, so there is no shared write target.

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

### Issue Workflow Skill

The `/issue-workflow <issue-url>` skill (`.claude/skills/issue-workflow/SKILL.md`) orchestrates the full 6-phase lifecycle — Setup, Plan, Implement, Review, Fix, Ship — as a single repeatable command. Use it as the default entry point for any new issue. The skill pauses for user approval after the Plan phase and after the Review phase. See the skill file for phase-by-phase details.

### Agent Reference Loading

Which `.claude/references/` files each agent loads in Step 0. All multi-reference agents load their set in a **single parallel batch** (see each agent's Step 0).

| Agent                    | References Loaded                                                                |
| ------------------------ | -------------------------------------------------------------------------------- |
| `code-reviewer`          | **All 13 references — full-load, always** (never conditionally gated; see below) |
| `plan-writer`            | core + diff-relevant domain refs (conditional; see below) + `CLAUDE.md`          |
| `architecture-advisor`   | core + diff-relevant domain refs (conditional; see below)                        |
| `refactoring-specialist` | solid, cupid, guiding-principles, maintainability                                |
| `domain-model-advisor`   | domain-model                                                                     |
| `test-generator`         | testing                                                                          |
| `security-auditor`       | auth, backend-api                                                                |
| `documentation-writer`   | —                                                                                |
| `migration-planner`      | —                                                                                |

#### Conditional Reference Loading (planning agents)

The **planning** agents (`plan-writer`, `architecture-advisor`) load a fixed **core** set every time plus only the **domain** references relevant to the diff. This cuts token ingestion on scoped diffs while a fail-open rule prevents under-informed plans on cross-cutting ones. **`code-reviewer` is deliberately excluded — it always loads its full 13-reference set** (it is the last line of defense; an under-informed review is the worst failure class). Single-reference agents are unaffected.

**Core — always loaded by the planning agents (never gated):**

`clean-architecture`, `solid`, `cupid`, `guiding-principles`, `cross-reference`, **`coding-agent-policies`** (hard-pinned, review-blocking), and `CLAUDE.md` (plan-writer only).

> `coding-agent-policies.md` is **hard-pinned to always-load** for every agent that loads references — it is never gated, in keeping with the session-start requirement at the top of this file.

**Domain — gated by the diff, per this glob→ref map:**

| Diff touches…                                                         | Load reference(s)                       |
| --------------------------------------------------------------------- | --------------------------------------- |
| `src/api/**`, `src/db/**`, `src/contracts/**`                         | `backend-api` + `domain-model` + `auth` |
| `*.guard.ts`, the auth store, `src/api/**/auth`, `src/contracts/auth` | `auth`                                  |
| generator dirs / generated files, or a scaffolding task               | `generators`                            |
| `src/app/components/**`, component templates, styles                  | `accessibility`                         |

Both planning agents share the **same** gated domain set — `auth`, `backend-api`, `domain-model`, `generators`, `accessibility` — so this map applies to each uniformly (no per-agent exceptions). `plan-writer` additionally always-loads `CLAUDE.md` as part of its core.

**Fail open:** on an empty, mixed-layer, or ambiguous diff — or any uncertainty — the planning agent loads **all** of its domain references. Cross-cutting diffs are the norm (the `crud` generator emits DB + API + contracts + provider + store + page at once), so the default under doubt is to load everything.

> **When adding a new reference file, update this map.** A reference added without a glob→ref entry will never be conditionally loaded. If unsure where it belongs, add it to the **core** (always-loaded) set rather than leaving it ungated.
>
> **`maintainability.md`** (the structural-simplification lens, #409) is loaded by **`code-reviewer`** (full set) and **`refactoring-specialist`** (fixed set). It is **not** part of the planning agents' gated set today — extending it to `architecture-advisor`/`plan-writer` is a candidate for the broader agent-review-quality follow-up, not an oversight.

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

**Supported form control elements:** `input`, `select`, `textarea`, or any component providing `FormFieldCustomControl`

The component reads the `FormField` directive from the projected child via `contentChild(SignalFormField)` — consumers only need `[formField]` on the child element, not on `<app-form-field>` itself.

The component enforces three runtime constraints via `effect()`:

1. Only a **single direct child** may be projected into `<ng-content>`
2. The projected child must be a **supported native form control** or provide `FormFieldCustomControl`
3. The projected child must have a `[formField]` directive assigned

**Custom component support:** Components that are not native form controls can be wrapped in `<app-form-field>` by:

1. Extending `FormFieldCustomControl` (from `@components/form-field/form-field-custom-control`)
2. Providing the token: `providers: [{ provide: FormFieldCustomControl, useExisting: forwardRef(() => MyComponent) }]`
3. Using the `ariaInvalid` signal (set by FormField) to apply conditional invalid styling

```typescript
// ✅ Custom component integration
@Component({
  providers: [{ provide: FormFieldCustomControl, useExisting: forwardRef(() => PermissionSelector) }],
})
export class PermissionSelector extends FormFieldCustomControl implements FormValueControl<number[]> {
  // ariaInvalid signal is inherited — use it for conditional border styling
}

// Usage in template:
<app-form-field label="Permissions">
  <app-permission-selector [formField]="roleForm.permissionIds" [groups]="groups()" />
</app-form-field>
```

**When adding a new native form control element type**, update these locations in `form-field.ts`:

| What to update                                         | Purpose                                           |
| ------------------------------------------------------ | ------------------------------------------------- |
| `private readonly supportedControls` class field       | Runtime validation of projected content           |
| `querySelector` selector in `afterRenderEffect()` body | `aria-invalid` attribute management               |
| `::ng-deep [aria-invalid='true']` style                | No change needed — targets attribute, not element |

---

## Automated Code Review

### Proactive Review Directive

**IMPORTANT:** After completing implementation work on any issue or feature branch, Claude MUST automatically delegate to the `code-reviewer` agent before considering the work complete.

This is a mandatory step in the workflow:

1. Complete implementation (code changes, tests, commits)
2. **Run `npm run ci:verify`** (cache-aware) — all CI checks must pass (exit code 0) before work is considered complete. This is an **intermediate** run; the cold `npm run ci` is reserved for the authoritative final gate before the PR is opened (see [Local CI Verification](#local-ci-verification)).
3. **Automatically run code review** using the `code-reviewer` agent
4. Provide a report to the user, with a prioritization of all the found issues, plus the recommendations and suggestions to address them. The report must be in form of a table, that will be used to track the pending work while addressing the issues, recommendations and suggestions.
5. Save the Proactive Review results to the `workspace/CODE_REVIEW.md` file for the user to review. The user will then manually decide what to do based on the report.

### Tracking Fixes

**IMPORTANT:** When fixing issues, warnings, or suggestions from `workspace/CODE_REVIEW.md`, Claude MUST update the **Addressed** column of the corresponding row immediately after the fix is applied — before moving on to the next issue. This keeps the review report in sync with the actual state of the code.

### Local CI Verification

**CRITICAL:** Before considering any implementation work complete, CI MUST pass with exit code 0 — use the cache-aware `npm run ci:verify` for intermediate runs and the cold `npm run ci` as the authoritative final gate before the PR (see below).

#### Two verification paths: cold `ci` vs cache-aware `ci:verify`

There are two CI scripts. They run the **same** tasks (`check`, `stylelint`, `lint`, `typecheck`, then `test`, `test-integration`, `build`, `build-storybook`); they differ only in cache behavior:

| Script              | Cache                                                              | Use for                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run ci`        | **Cold** — `--skip-nx-cache` on every task                         | The **authoritative final gate** (Phase 6 / before opening a PR). Guarantees correctness independent of cache state.                                                                                          |
| `npm run ci:verify` | **Cache-aware** — rides the Nx local (and remote, see below) cache | Repeated **intermediate** runs in the agent inner loop, where the tree is largely unchanged between runs. On an unchanged tree this collapses to a near-instant cache restore instead of a full cold rebuild. |

**Rule:** Use `npm run ci:verify` for the repeated intermediate checks inside a workflow (e.g. the `code-reviewer` agent's verification step, post-fix re-runs). Use the cold `npm run ci` as the **final** gate before the PR is opened — a cold run is the only run that proves correctness independent of cache state. Never substitute `ci:verify` for the final gate.

> **Permission note:** `npm run ci:verify` is already authorized by the pre-existing `Bash(npm run ci:*)` allow-rule in `.claude/settings.local.json` — the glob matches because `ci:verify` begins with the `ci:` prefix — so no new allow-rule is required.

> **Local cache only:** `ci:verify` rides the Nx **local** cache. This workspace does not use Nx Cloud — see [`docs/NX_CLOUD.md`](docs/NX_CLOUD.md) for the rationale.

The `npm run ci` command runs CI checks in two parallel batches via `nx run-many`:

**Batch 1 (fast checks, parallel):**

- `check` — repo-wide guards run as one `nx:run-commands` target on `@app/source`: no `.env*` files (`check-no-env-files.mjs`), no issue refs in code comments (`check-no-issue-refs-in-comments.mjs`), and prettier formatting (`prettier --check`). The three commands run sequentially inside the target (`parallel: false` — the first failure short-circuits, matching the old `&&` chain). Adding a future repo-wide guard means adding one command to this target — the `ci`/`ci:verify` scripts do not change. `cache: false` (these guards inspect working-tree state, so they always run). Also enforced remotely by the `check` job in `.github/workflows/ci.yml`, so a `--no-verify` push cannot skip the guards.
- `stylelint` — CSS/style linting
- `lint` — TypeScript/ESLint linting
- `typecheck` — Type-check spec files (`tsc --noEmit`)

**Batch 2 (heavy tasks, parallel — runs only if Batch 1 passes):**

- `test` — Unit tests
- `test-integration` — Integration tests (requires PostgreSQL)
- `build` — Production build
- `build-storybook` — Storybook build (`npm run storybook:build`)

If any task in a batch fails, Nx reports an error after all parallel tasks in the batch complete. Batch 2 does not run if Batch 1 exits with an error.

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
┌──────────────────────┐
│  npm run ci:verify   │ ◄── intermediate (cache-aware) — MUST pass with exit code 0
│   (mandatory)        │
└──────────┬───────────┘
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
┌──────────────────────┐
│  npm run ci          │ ◄── cold final gate — MUST pass with exit code 0
│   (mandatory)        │
└──────────┬───────────┘
         │
         ▼
┌─────────────────┐
│  Ready for PR   │
└─────────────────┘
```

---

_Last updated: 2026-06-21_
