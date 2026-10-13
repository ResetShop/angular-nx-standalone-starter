# <Context name> context

> Status: draft | in review | accepted · Last reviewed: <date> · Reviewers: <names>
> Decisions are recorded with their date in section 14.

## 1. Purpose

What this context is responsible for, in two or three sentences, and what it is not responsible for.

## 2. Relationships with other contexts

| Context | Direction (upstream / downstream) | What crosses the boundary (ids, events, shared types) | Translation needed |
| ------- | --------------------------------- | ----------------------------------------------------- | ------------------ |

References between aggregates, within and across contexts, are by id only.

## 3. Ubiquitous language

Terms used in this context, each linked to its [glossary](../glossary.md) entry. A term that means something else in
another context is called out here.

## 4. Aggregates and entities

For each aggregate root and entity:

| Field      | Content                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Name       | The domain name                                                                                  |
| Identity   | What identifies it (surrogate `id`, natural key)                                                 |
| Boundary   | What belongs to the aggregate (history tables are part of it or a separate log), one transaction |
| Properties | Name, type, nullability, meaning; value objects named                                            |
| Invariants | Rules that must always hold                                                                      |
| Lifecycle  | Record status and any workflow states, with the allowed transitions                              |
| Behaviour  | Operations it exposes and the events they raise                                                  |
| Uniqueness | Which unique keys are global and which only among live records                                   |

## 5. Value objects

Immutable values with their validation, equality and arithmetic (for example `Money`, `NationalIdNumber`).

## 6. Lookups and reference data

Closed catalogues of this context, each with its codes and flags (see [lookup tables](../lookup-tables.md)), and the
reference-data ports that serve them.

## 7. Repository ports

Interface name, the operations (`find…`), what each returns, and the criteria objects. Repositories belong to aggregates.

## 8. Use cases

For each: actor, input, steps, the aggregates it touches, the transaction boundary, the events raised, the errors.

## 9. Policies

Business rules extracted as pure functions: name, inputs, decision.

## 10. Legacy mapping

| Legacy element | Domain element | Postgres element | Notes |
| -------------- | -------------- | ---------------- | ----- |

Every legacy table and column of the context appears here, mapped or marked "not carried over" with the reason. This is
the one place where the mapping is kept.

## 11. Stage 1 bridge

How the legacy MySQL tables are read and written until the data moves: bridge schema, id → code maps for lookups,
conversions (money, dates, flags), and the legacy behaviours the repositories must tolerate.

## 12. Permissions and API contracts

The permissions (`module:resource:action`) that protect each operation, and the endpoints and Zod contracts that expose
the use cases.

## 13. Domain events

Past-tense events, their payload and who reacts to them. Events are handled in process, in the same transaction, as
planned in the architecture decisions (provisional until those are written).

## 14. Decisions

| Date | Decision | Alternatives considered |
| ---- | -------- | ----------------------- |

## 15. Legacy defects deliberately not kept

What the legacy system did wrongly and the new behaviour replacing it.

## 16. Open questions

Questions that block acceptance, each with an owner.
