<!-- Source: CLAUDE.md | Last updated: 2026-02-09 -->

# Clean Architecture Principles

Create systems that are maintainable, testable, and independent of external concerns.

## Core Architectural Principles

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

## Component Cohesion Principles

_What classes belong in which components_

| Principle                     | Acronym | Rule                                                                             |
| ----------------------------- | ------- | -------------------------------------------------------------------------------- |
| **Reuse/Release Equivalence** | REP     | The granule of reuse is the granule of release. Group classes released together. |
| **Common Closure**            | CCP     | Gather classes that change for the same reasons and at the same times.           |
| **Common Reuse**              | CRP     | Don't force users to depend on things they don't need.                           |

**Tension:** REP and CCP make components larger; CRP makes them smaller. Early projects favor CCP; mature projects favor REP and CRP.

---

## Component Coupling Principles

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

## Practical Guidelines

1. **Start with use cases** — They define system intent
2. **Defer decisions** — Delay framework, database, UI decisions as long as possible
3. **Screaming architecture** — Top-level structure should reveal the domain ("Healthcare System"), not the framework ("Rails App")
4. **Humble objects** — Keep hard-to-test things (UI, DB) in minimal wrappers
5. **Main is dirty** — The main component instantiates everything and knows all dependencies

_Source: Robert C. Martin, "Clean Architecture" (2018)_

---

## Project-Specific UI Architecture Rules

### Create/Edit Drawer Separation

Create and edit drawers for any entity **must be completely separate components**. Never share form fields between them via a wrapper component, shared form-fields component, or a single drawer with a `mode` signal.

**Rules:**

1. Each drawer owns its own form model, validation schema, template, and submit handler
2. Each drawer has a single public method: `open()` for create, `open(entityId)` for edit
3. No `mode` signal, no `@if (mode() === 'edit')` branching in templates
4. Duplication between the two is acceptable — each form can evolve independently

**Rationale:** Shared extractions add indirection (slot contracts, extra files, input/output wiring) for marginal duplication savings. Fully separate drawers are easier to read, test, and evolve independently. When create and edit diverge (different fields, validation rules, confirmation steps), there is no shared component to untangle.

**Naming convention:** `CreateXDrawer` and `EditXDrawer` in separate directories:

```
pages/<domain>/
├── create-<entity>-drawer/
│   ├── create-<entity>-drawer.ts
│   └── create-<entity>-drawer.spec.ts
└── edit-<entity>-drawer/
    ├── edit-<entity>-drawer.ts
    └── edit-<entity>-drawer.spec.ts
```
