# Project Guidelines

> **Purpose:** This document provides coding standards, architectural principles, and tooling guidelines for this project. Claude Code should follow these guidelines when generating, reviewing, or modifying code.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Hard Constraints](#hard-constraints)
3. [Nx Guidelines](#nx-guidelines)
4. [Testing Guidelines](#testing-guidelines)
5. [Code Architecture Guidelines](#code-architecture-guidelines)
6. [Backend API Naming Conventions](#backend-api-naming-conventions)
7. [Error Handling Guidelines](#error-handling-guidelines)
8. [Domain Model Guidelines](#domain-model-guidelines)
9. [Development Workflow](#development-workflow)
10. [Automated Code Review](#automated-code-review)

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
| **State Management** | NgRx                                |

### Common Commands

Use `npm` for all package management and script execution:

| Command                   | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `npm install`             | Install dependencies                           |
| `npm run ci`              | Run all CI checks locally (required before PR) |
| `npm run build`           | Build the project                              |
| `npm run dev`             | Start development server                       |
| `npm run lint`            | Run linting                                    |
| `npm run storybook`       | Run storybook dev server                       |
| `npm run storybook:build` | Build storybook                                |
| `npm run stylelint`       | Run stylelint                                  |
| `npm run test`            | Run all unit tests                             |
| `npm run test:e2e`        | Run all end-to-end tests                       |
| `npm install <pkg>`       | Add a dependency                               |
| `npm install -D <pkg>`    | Add a dev dependency                           |
| `npm install -g <pkg>`    | Add a global dependency                        |

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

| Constraint             | Limit                                                                                     | Rationale                    |
| ---------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| Function length        | ≤ 50 lines                                                                                | Readability, SRP             |
| File length            | ≤ 500 lines (spec files exempt)                                                           | Maintainability              |
| Cyclomatic complexity  | ≤ 10                                                                                      | Testability                  |
| Nesting depth          | ≤ 3 levels                                                                                | Readability                  |
| Barrel imports/exports | Not allowed in any part of the project                                                    | Maintainability, Performance |
| `any` type             | Forbidden without `// REASON:` comment                                                    | Type safety                  |
| `// @ts-ignore`        | Forbidden without linked issue                                                            | Technical debt tracking      |
| `console.log`          | Remove before commit                                                                      | Clean code                   |
| TypeScript enums       | Forbidden - use `Object.freeze()` instead                                                 | Consistency, type safety     |
| Type-only imports      | Use `type` keyword for types/interfaces when only used in the context of type annotations | Bundle size, clarity         |
| `vi.fn()`/`vi.mock()`  | Forbidden — use `fn()` from `@test-utils`; ESLint enforced                                | Framework independence       |

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
- Add an updated entry in the Bruno API client workspace for each new endpoint
- Update the entries in the Bruno API client workspace if an endpoint is updated

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
	enabled: boolean | null;
	deleted: boolean | null;
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

**Commit messages:** Prefix with `[#<issue_number>]`

```
[#144] Remove vercel.json and API redirect entry point
[#87] Add login form component
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

| Agent                    | References Loaded                                                           |
| ------------------------ | --------------------------------------------------------------------------- |
| `code-reviewer`          | All 8 references                                                            |
| `plan-writer`            | All 8 references                                                            |
| `architecture-advisor`   | clean-architecture, solid, cupid, guiding-principles, cross-reference, auth |
| `refactoring-specialist` | solid, cupid, guiding-principles                                            |
| `domain-model-advisor`   | domain-model                                                                |
| `test-generator`         | testing                                                                     |
| `security-auditor`       | auth                                                                        |
| `documentation-writer`   | —                                                                           |
| `migration-planner`      | —                                                                           |

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
3. `npm run test` — Unit tests
4. `npm run build` — Production build
5. `npm run storybook:build` — Storybook build

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

_Last updated: 2026-02-19_
