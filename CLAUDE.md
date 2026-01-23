# Project Guidelines

> **Purpose:** This document provides coding standards, architectural principles, and tooling guidelines for this project. Claude Code should follow these guidelines when generating, reviewing, or modifying code.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Hard Constraints](#hard-constraints)
3. [Nx Guidelines](#nx-guidelines)
4. [Testing Guidelines](#testing-guidelines)
5. [Code Architecture Guidelines](#code-architecture-guidelines)

- [Guiding Principles (YAGNI, KISS)](#guiding-principles)
- [CUPID Principles](#cupid-principles)
- [SOLID Principles](#solid-principles)
- [Clean Architecture Principles](#clean-architecture-principles)

6. [Principles Cross-Reference](#principles-cross-reference)
7. [Domain Model Guidelines](#domain-model-guidelines)
8. [Automated Code Review](#automated-code-review)

---

## Project Overview

<!-- TODO: Customize this section for your specific project -->

| Aspect               | Value                                  |
| -------------------- | -------------------------------------- |
| **Framework**        | Angular 17+ (standalone components)    |
| **Language**         | TypeScript (strict mode)               |
| **Monorepo Tool**    | Nx                                     |
| **Package Manager**  | pnpm                                   |
| **Testing**          | Vitest + Angular Testing Library       |
| **State Management** | <!-- e.g., NgRx, Signals, Services --> |

### Common Commands

Use `pnpm` for all package management and script execution:

| Command                    | Description              |
| -------------------------- | ------------------------ |
| `pnpm install`             | Install dependencies     |
| `pnpm run build`           | Build the project        |
| `pnpm run dev`             | Start development server |
| `pnpm run lint`            | Run linting              |
| `pnpm run storybook`       | Run storybook dev server |
| `pnpm run storybook:build` | Build storybook          |
| `pnpm run stylelint`       | Run linting              |
| `pnpm run test`            | Run all unit tests       |
| `pnpm run test:e2e`        | Run all end-to-end tests |
| `pnpm add <pkg>`           | Add a dependency         |
| `pnpm add -D <pkg>`        | Add a dev dependency     |
| `pnpm add -g <pkg>`        | Add a global dependency  |

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

---

## Hard Constraints

These are non-negotiable rules. Violations require explicit justification.

| Constraint             | Limit                                                                                     | Rationale                    |
| ---------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| Function length        | ≤ 50 lines                                                                                | Readability, SRP             |
| File length            | ≤ 500 lines                                                                               | Maintainability              |
| Cyclomatic complexity  | ≤ 10                                                                                      | Testability                  |
| Nesting depth          | ≤ 3 levels                                                                                | Readability                  |
| Barrel imports/exports | Not allowed in any part of the project                                                    | Maintainability, Performance |
| `any` type             | Forbidden without `// REASON:` comment                                                    | Type safety                  |
| `// @ts-ignore`        | Forbidden without linked issue                                                            | Technical debt tracking      |
| `console.log`          | Remove before commit                                                                      | Clean code                   |
| Type-only imports      | Use `type` keyword for types/interfaces when only used in the context of type annotations | Bundle size, clarity         |

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

### Scope Rules for Constants

- **Local constants:** Keep inside the function scope when used by a single function
- **Module constants:** Promote to module level only when shared across multiple functions in the same file
- **Global constants:** Use only after analysis confirms reuse across multiple files

---

## Nx Guidelines

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

### General Rules

- **Always use Nx to run tasks** (build, lint, test, e2e) instead of underlying tooling directly
- Use `nx run`, `nx run-many`, or `nx affected` for all task execution
- You have access to the Nx MCP server and its tools—use them

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
4. Verify the fix by running the failing task locally

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
- Use **framework-agnostic mocking** when possible (plain objects/functions over Angular-specific mocks)
- Add an updated entry in the Bruno API client workspace for each new endpoint
- Update the entries in the Bruno API client worskspace if an endpoint is updated

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

### Basic Component Test Pattern

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

### Testing User Interactions

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

### Testing Async Behavior

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

### Testing Services

```typescript
import { render, screen } from '@testing-library/angular';

describe('ComponentWithService', () => {
	it('should use injected service', async () => {
		// Prefer plain object mocks over Angular testing utilities
		const mockUserService = {
			getUser: jest.fn().mockResolvedValue({ name: 'John' }),
		};

		await render(UserProfileComponent, {
			providers: [{ provide: UserService, useValue: mockUserService }],
		});

		expect(await screen.findByText('John')).toBeInTheDocument();
	});
});
```

### Testing Form Inputs

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

---

## Code Architecture Guidelines

### Guiding Principles

#### YAGNI (You Aren't Gonna Need It)

**Add functionality only when it's actually needed, not for hypothetical future use.**

**Do:**

- Implement exactly what the current requirement demands
- Delete unused code, parameters, and abstractions
- Question every "what if we need this later?" addition

**Don't:**

- Add parameters "for flexibility"
- Create abstract classes for single implementations
- Build configuration options nobody requested
- Add extension points "just in case"

**Practical test:** If you can't name a concrete, current use case for something, don't build it.

---

#### KISS (Keep It Simple, Stupid)

**Prefer simple solutions over clever ones. Complexity is a cost, not a feature.**

**Do:**

- Choose the straightforward approach first
- Use standard library functions over custom implementations
- Write code that junior developers can understand
- Refactor when complexity grows

**Don't:**

- Over-abstract prematurely
- Use design patterns just to use them
- Optimize before measuring
- Add layers without clear purpose

**Practical test:** Can you explain what this code does in one sentence? If not, simplify.

---

### CUPID Principles

Write code that is a joy to work with by making it:

#### Composable

- Design components that combine easily with others
- Keep dependencies minimal and explicit
- Favor small, focused units that work well together
- Enable plug-and-play behavior through clear interfaces

#### Unix Philosophy

- Do one thing well
- Work with text streams and simple interfaces when possible
- Design for composability with other tools
- Avoid unnecessary complexity

#### Predictable

- Code should do what it looks like it does
- Behave consistently and deterministically
- Minimize surprises; follow the principle of least astonishment
- Use clear, intention-revealing names
- Handle edge cases explicitly and visibly

#### Idiomatic

- Follow the conventions of the language, framework, and codebase
- Write code that feels natural to developers familiar with the ecosystem
- Use standard patterns and idioms—don't reinvent the wheel
- Respect existing style and structure in the project

#### Domain-Based

- Use the language of the problem domain, not technical implementation details
- Structure code around business concepts
- Make the code tell the story of what the system does
- Keep domain logic separate from infrastructure concerns

_Source: Dan North, "CUPID—for joyful coding"_

---

### SOLID Principles

Design classes, modules, and their relationships to be flexible, maintainable, and resilient to change.

#### S — Single Responsibility Principle (SRP)

**A class should have one, and only one, reason to change.**

- Each class or module owns a single part of the functionality
- "Reason to change" = one actor or stakeholder whose needs might cause modifications
- If describing what a class does requires "and," consider splitting it

**Symptoms of violation:** Large classes, unrelated methods grouped together, changes rippling across unrelated functionality.

**Guidance:**

- Separate persistence, validation, formatting, and business logic into distinct classes
- Prefer many small, focused classes over few large, multipurpose ones

---

#### O — Open/Closed Principle (OCP)

**Software entities should be open for extension but closed for modification.**

- Add new behavior without changing existing code
- Achieve through abstraction: depend on interfaces, not concrete implementations
- New functionality = new classes implementing existing interfaces

**Symptoms of violation:** Adding `if/else` or `switch` statements whenever a new type is introduced.

**Guidance:**

- Use polymorphism and inheritance strategically for extension points
- Favor composition over inheritance when extending behavior

---

#### L — Liskov Substitution Principle (LSP)

**Subtypes must be substitutable for their base types without altering program correctness.**

- If S is a subtype of T, objects of type T can be replaced with objects of type S
- Derived classes must honor base class contracts (preconditions, postconditions, invariants)

**Symptoms of violation:** `instanceof` checks, type-specific conditionals in client code.

**Guidance:**

- Don't override methods in ways that violate base class expectations
- If a subclass can't fully support a base class method, the hierarchy is wrong
- Classic example: `Square extends Rectangle` where `setWidth()`/`setHeight()` behave unexpectedly

---

#### I — Interface Segregation Principle (ISP)

**Clients should not be forced to depend on interfaces they do not use.**

- Prefer many small, specific interfaces over one large, general-purpose interface
- Each interface represents a cohesive set of behaviors for a specific client

**Symptoms of violation:** Implementers throwing `NotImplementedException`, classes implementing interfaces with unused methods.

**Guidance:**

- Design interfaces from the client's perspective
- Role interfaces (`Readable`, `Writable`) over header interfaces (`File`)

---

#### D — Dependency Inversion Principle (DIP)

**High-level modules should not depend on low-level modules. Both should depend on abstractions.**

- Invert traditional dependencies: both high and low level depend on interfaces
- High-level policy defines interfaces; low-level details implement them

**Guidance:**

- Inject dependencies rather than instantiating directly
- Define interfaces alongside the code that uses them, not the code that implements them
- Avoid direct references to concrete classes for volatile dependencies (databases, external services)

---

#### SOLID Relationships

| Principle | Enables                                                            |
| --------- | ------------------------------------------------------------------ |
| SRP       | Makes OCP easier—focused classes are simpler to extend             |
| OCP       | Relies on DIP—extensions work through abstractions                 |
| LSP       | Ensures OCP works—substitutable subtypes enable safe polymorphism  |
| ISP       | Supports SRP—segregated interfaces reflect single responsibilities |
| DIP       | Enables all—abstractions are the foundation of flexible design     |

_Source: Robert C. Martin, "Clean Code" (2008)_

---

### Clean Architecture Principles

Create systems that are maintainable, testable, and independent of external concerns.

#### Core Architectural Principles

**The Dependency Rule**

- Source code dependencies must point **only inward**, toward higher-level policies
- Nothing in an inner circle can know anything about an outer circle
- Data formats from outer circles must not be used by inner circles
- This is the overriding rule that makes the architecture work

**The Layers** (innermost to outermost):

| Layer                    | Contents                                            | Example                                         |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------- |
| **Entities**             | Enterprise business rules, critical business data   | `User`, `Order`, `Invoice`                      |
| **Use Cases**            | Application-specific business rules                 | `CreateOrderUseCase`, `AuthenticateUserUseCase` |
| **Interface Adapters**   | Convert data between use cases and external formats | Controllers, Presenters, Gateways               |
| **Frameworks & Drivers** | External details                                    | UI, Database, Web frameworks                    |

**Independence Principles:**

- **Framework Independence** — Use frameworks as tools, not constraints
- **UI Independence** — UI can change without affecting business rules
- **Database Independence** — Business rules not bound to specific database
- **External Agency Independence** — Business rules know nothing about outside world

**Testability by Design:**

- Business rules testable without UI, database, web server, or any external element
- Entities and use cases are plain objects with no framework dependencies

**Boundary Crossing:**

- Define clear boundaries between components with different rates of change
- Cross boundaries using Dependency Inversion: inner layers define interfaces, outer layers implement
- Data crossing boundaries should be simple DTOs, not entities or database rows

---

#### Component Cohesion Principles

_What classes belong in which components_

| Principle                     | Acronym | Rule                                                                             |
| ----------------------------- | ------- | -------------------------------------------------------------------------------- |
| **Reuse/Release Equivalence** | REP     | The granule of reuse is the granule of release. Group classes released together. |
| **Common Closure**            | CCP     | Gather classes that change for the same reasons and at the same times.           |
| **Common Reuse**              | CRP     | Don't force users to depend on things they don't need.                           |

**Tension:** REP and CCP make components larger; CRP makes them smaller. Early projects favor CCP; mature projects favor REP and CRP.

---

#### Component Coupling Principles

_How components relate to each other_

| Principle                | Acronym | Rule                                               |
| ------------------------ | ------- | -------------------------------------------------- |
| **Acyclic Dependencies** | ADP     | No cycles in the component dependency graph.       |
| **Stable Dependencies**  | SDP     | Depend in the direction of stability.              |
| **Stable Abstractions**  | SAP     | A component should be as abstract as it is stable. |

**Stability Metrics:**

- **Instability (I)** = Fan-out / (Fan-in + Fan-out) — Range: 0 (stable) to 1 (unstable)
- **Abstractness (A)** = Abstract classes & interfaces / Total classes
- Target the **Main Sequence** (A + I ≈ 1), avoid **Zone of Pain** (stable & concrete) and **Zone of Uselessness** (unstable & abstract)

---

#### Practical Guidelines

1. **Start with use cases** — They define system intent
2. **Defer decisions** — Delay framework, database, UI decisions as long as possible
3. **Screaming architecture** — Top-level structure should reveal the domain ("Healthcare System"), not the framework ("Rails App")
4. **Humble objects** — Keep hard-to-test things (UI, DB) in minimal wrappers
5. **Main is dirty** — The main component instantiates everything and knows all dependencies

_Source: Robert C. Martin, "Clean Architecture" (2018)_

---

## Principles Cross-Reference

Several principles reinforce the same core ideas. Use whichever framing fits your context:

| Concept                           | Class Design | Component Design | General Code    |
| --------------------------------- | ------------ | ---------------- | --------------- |
| **Single focus**                  | SRP          | CCP              | Unix Philosophy |
| **Depend on abstractions**        | DIP          | SDP, SAP         | —               |
| **Don't depend on unused things** | ISP          | CRP              | Composable      |
| **Extend without modifying**      | OCP          | —                | —               |
| **Match expectations**            | LSP          | —                | Predictable     |
| **Follow conventions**            | —            | —                | Idiomatic       |
| **Use domain language**           | —            | —                | Domain-Based    |
| **Only build what's needed**      | —            | —                | YAGNI           |
| **Prefer simplicity**             | —            | —                | KISS            |

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

### Structure

Organize domain models by bounded context:

```
src/app/domain/
├── <context>/              # e.g., access/, user/, auth/
│   ├── <entity>.interface.ts
│   ├── <entity>.model.ts
│   ├── <entity>.mapper.ts
│   └── <entity>.model.spec.ts
```

### Interface-First Design

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

### Factory Functions

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

### Immutability

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

### Performance: O(1) Lookups

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

### Runtime Validation

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

### Mappers

Use mappers to transform between layers (API contracts ↔ domain models ↔ storage):

| Function                   | Purpose                     |
| -------------------------- | --------------------------- |
| `mapLoginResponseToUser()` | API response → domain model |
| `mapStorageDataToUser()`   | localStorage → domain model |
| `mapUserToStorageData()`   | domain model → localStorage |

Mappers should use factory functions internally for consistency.

---

## Automated Code Review

### Proactive Review Directive

**IMPORTANT:** After completing implementation work on any issue or feature branch, Claude MUST automatically delegate to the `code-reviewer` agent before considering the work complete.

This is a mandatory step in the workflow:

1. Complete implementation (code changes, tests, commits)
2. **Automatically run code review** using the `code-reviewer` agent
3. Provide a report to the user, with a prioritization of all the found issues, plus the recommendations and suggestions to address them. The report must be in form of a table, that will be used to track the pending work while addressing the issues, recommendations and suggestions.
4. Save the Proactive Review results to the `.claude/CODE_REVIEW.md` file for the user to review. The user will then manually decide what to do based on the report.

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
│  Implementation │
│   (commits)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Code Review    │ ◄── Automatic delegation to code-reviewer agent
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

_Last updated: 2026-01-22_
