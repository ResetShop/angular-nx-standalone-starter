<!-- Source: CLAUDE.md | Last updated: 2026-02-09 -->

# SOLID Principles

Design classes, modules, and their relationships to be flexible, maintainable, and resilient to change.

## S — Single Responsibility Principle (SRP)

**A class should have one, and only one, reason to change.**

- Each class or module owns a single part of the functionality
- "Reason to change" = one actor or stakeholder whose needs might cause modifications
- If describing what a class does requires "and," consider splitting it

**Symptoms of violation:** Large classes, unrelated methods grouped together, changes rippling across unrelated functionality.

**Guidance:**

- Separate persistence, validation, formatting, and business logic into distinct classes
- Prefer many small, focused classes over few large, multipurpose ones

---

## O — Open/Closed Principle (OCP)

**Software entities should be open for extension but closed for modification.**

- Add new behavior without changing existing code
- Achieve through abstraction: depend on interfaces, not concrete implementations
- New functionality = new classes implementing existing interfaces

**Symptoms of violation:** Adding `if/else` or `switch` statements whenever a new type is introduced.

**Guidance:**

- Use polymorphism and inheritance strategically for extension points
- Favor composition over inheritance when extending behavior

---

## L — Liskov Substitution Principle (LSP)

**Subtypes must be substitutable for their base types without altering program correctness.**

- If S is a subtype of T, objects of type T can be replaced with objects of type S
- Derived classes must honor base class contracts (preconditions, postconditions, invariants)

**Symptoms of violation:** `instanceof` checks, type-specific conditionals in client code.

**Guidance:**

- Don't override methods in ways that violate base class expectations
- If a subclass can't fully support a base class method, the hierarchy is wrong
- Classic example: `Square extends Rectangle` where `setWidth()`/`setHeight()` behave unexpectedly

---

## I — Interface Segregation Principle (ISP)

**Clients should not be forced to depend on interfaces they do not use.**

- Prefer many small, specific interfaces over one large, general-purpose interface
- Each interface represents a cohesive set of behaviors for a specific client

**Symptoms of violation:** Implementers throwing `NotImplementedException`, classes implementing interfaces with unused methods.

**Guidance:**

- Design interfaces from the client's perspective
- Role interfaces (`Readable`, `Writable`) over header interfaces (`File`)

---

## D — Dependency Inversion Principle (DIP)

**High-level modules should not depend on low-level modules. Both should depend on abstractions.**

- Invert traditional dependencies: both high and low level depend on interfaces
- High-level policy defines interfaces; low-level details implement them

**Guidance:**

- Inject dependencies rather than instantiating directly
- Define interfaces alongside the code that uses them, not the code that implements them
- Avoid direct references to concrete classes for volatile dependencies (databases, external services)

---

## SOLID Relationships

| Principle | Enables                                                            |
| --------- | ------------------------------------------------------------------ |
| SRP       | Makes OCP easier—focused classes are simpler to extend             |
| OCP       | Relies on DIP—extensions work through abstractions                 |
| LSP       | Ensures OCP works—substitutable subtypes enable safe polymorphism  |
| ISP       | Supports SRP—segregated interfaces reflect single responsibilities |
| DIP       | Enables all—abstractions are the foundation of flexible design     |

_Source: Robert C. Martin, "Clean Code" (2008)_
