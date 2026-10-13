# Organization context

> Status: draft · Last reviewed: 2026-10-13 · Reviewers: Ramiro
> Decisions are recorded with their date in section 14.

## 1. Purpose

The Organization context owns the places where the business operates: the **office branches**. It knows each office
branch's identity, name, code and address, and lets staff list them and register a new one.

It is not responsible for who works at which office branch (a later follow-up), for the cash movements or repairs that
happen at a branch (Treasury and Workshop), or for which branch a person is currently working in (a frontend concern
today).

## 2. Relationships with other contexts

| Context  | Direction             | What crosses the boundary                                                                                                                                                                                                      | Translation needed |
| -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| Treasury | Organization upstream | `office_branch_id` on every cash movement. **A cash movement must always have an office branch: there is no default, and a missing branch is an error.** The branch is an explicit required input, never an implicit fallback. | none               |
| Workshop | Organization upstream | The office branch of the income movements a repair generates (through Treasury). Repairs themselves have no branch.                                                                                                            | none               |
| Identity | none for now          | A later follow-up assigns users to one or more office branches.                                                                                                                                                                | none               |

References from other contexts are by id only.

## 3. Ubiquitous language

- **Office branch** (`OfficeBranch`): a place where the business operates and records cash and repairs.
- **Office branch code** (`code`): a short machine-readable name derived from the branch's name.

Both are in the [glossary](../glossary.md). "Branch" alone is not used in the codebase: it collides with source-control
branches.

## 4. Aggregates and entities

### OfficeBranch

An office branch is staff-managed master data with few rules, so it is a **plain record**, not a rich aggregate.

| Field      | Content                                                                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name       | `OfficeBranch`                                                                                                                                                                                               |
| Identity   | Surrogate `id`; `name` and `code` are also unique natural keys                                                                                                                                               |
| Boundary   | The record alone; one transaction per operation                                                                                                                                                              |
| Properties | `id`; `name` (required text, unique, never shared by two branches); `code` (required text, unique, derived from the name when the branch is created); `address` (required text)                              |
| Invariants | The name is not empty and no other office branch has it; the code is not empty and no other office branch has it; the address is not empty                                                                   |
| Lifecycle  | None for now: every office branch can be used. A lifecycle (`active` / `disabled`) with its history is a later follow-up, so this table is an explicit exception to the lifecycle and audit rules until then |
| Behaviour  | Creation, which derives the code. No other operation exists in the legacy system, and none is added now                                                                                                      |
| Uniqueness | `name` is globally unique, `code` is globally unique                                                                                                                                                         |

## 5. Value objects

None. The derivation of the code is a policy (section 9).

## 6. Lookups and reference data

None. Office branches are staff-managed data (see [lookup tables](../lookup-tables.md)); their names and addresses are
stored as typed and are not translated.

## 7. Repository ports

`OfficeBranchRepository` (a plain record, so a small port):

- `findAll()`: every office branch.
- `findById(id)`: one office branch, or none.
- `findByName(name)` / `findByCode(code)`: to enforce uniqueness and to resolve a branch.
- `create(branch)`: stores a new office branch.

## 8. Use cases

| Use case           | Actor                                   | Input             | Steps                                                                                        | Aggregates touched | Transaction     | Events | Errors                                   |
| ------------------ | --------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------- | ------------------ | --------------- | ------ | ---------------------------------------- |
| ListOfficeBranches | Any signed-in staff                     | none              | Return every office branch                                                                   | none               | read only       | none   | none                                     |
| CreateOfficeBranch | Staff allowed to create office branches | `name`, `address` | Validate, derive the code, refuse a name or code already taken, store, return the new branch | `OfficeBranch`     | one transaction | none   | Invalid input; name or code already used |

## 9. Policies

- **`deriveOfficeBranchCode(name)`**: the legacy rule, kept as it is: the name in lower case with each space replaced by an
  underscore. Several consecutive spaces or surrounding spaces are not special-cased (the name is trimmed first). Two different names can derive the same code (for example "A B" and "a_b"); the unique code key then refuses the second one. Codes already stored are kept as they are.

## 10. Legacy mapping

| Legacy element                                                  | Domain element        | Postgres element                            | Notes                                                                                                                            |
| --------------------------------------------------------------- | --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `sh_administration_office_branch`                               | `OfficeBranch`        | `office_branch`                             | No timestamps, audit or lifecycle in the legacy table; the new table starts without them as the declared exception of section 14 |
| `.id`                                                           | `id`                  | `office_branch.id`                          | Ids preserved                                                                                                                    |
| `.name`                                                         | `name`                | `name`                                      | Not unique in the legacy schema: duplicates are checked in the live data                                                         |
| `.code_name`                                                    | `code`                | `code`                                      | Renamed; same derivation                                                                                                         |
| `.address`                                                      | `address`             | `address`                                   |                                                                                                                                  |
| `sh_administration_branch`                                      | not carried over      | none                                        | Old, unused table of branches                                                                                                    |
| `sh_administration_user_branch`                                 | not carried over      | none                                        | Unused; its idea returns as a later follow-up (user ↔ office branch assignment)                                                  |
| Cash `id_branch` default 1, history `id_branch` (never written) | no default, no column | `cash_movement.office_branch_id` (required) | Decided in the Treasury review; see section 2                                                                                    |

## 11. Stage 1 bridge

- Bridge schema: `mysqlTable('sh_administration_office_branch', { id, name, code: varchar('code_name'), address })`. The table
  has no audit columns, so the repository maps none.
- The legacy API's `create` returned the stored row; the new use case returns the same fields.
- The legacy table does not forbid duplicate names. Before the unique key can exist, the live data is checked for
  duplicates; any found are resolved in the data-quality work.

## 12. Permissions and API contracts

| Operation          | Endpoint (proposed)         | Permission (proposed, final names in the authorization slice)                                                                                                   |
| ------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ListOfficeBranches | `GET /api/office-branches`  | Any signed-in staff                                                                                                                                             |
| CreateOfficeBranch | `POST /api/office-branches` | `organization:office-branch:create` (proposed; final names in the authorization slice; the legacy frontend table allows administrator, owner and counter clerk) |

Contract: `OfficeBranch { id, name, code, address }`; create request `{ name, address }`; a duplicate name or code answers
with a conflict error. The legacy `GET /office-branch/getAll` and `POST /office-branch/create` are replaced.

## 13. Domain events

None.

## 14. Decisions

| Date       | Decision                                                                                                                                                                                                                        | Alternatives considered                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 2026-10-13 | The entity is `OfficeBranch` (`office_branch`, `office_branch_id`)                                                                                                                                                              | `Branch` (clashes with source-control branches), `Shop`, `Location` |
| 2026-10-13 | The legacy `code_name` is kept as `code`, still derived from the name                                                                                                                                                           | Dropping it                                                         |
| 2026-10-13 | An office branch's name is unique and never shared                                                                                                                                                                              | Allowing equal names                                                |
| 2026-10-13 | A cash movement must always have an office branch; no default; a missing branch is an error                                                                                                                                     | Keeping the legacy default of branch 1                              |
| 2026-10-13 | `sh_administration_branch` and `sh_administration_user_branch` are dropped (not carried over)                                                                                                                                   | Keeping either                                                      |
| 2026-10-13 | Lifecycle (`active` / `disabled`) with history, editing, the user ↔ office branch assignment table and auditing are follow-ups after the migration. `office_branch` is an exception to the lifecycle and audit rules until then | Doing them now                                                      |

## 15. Legacy defects deliberately not kept

- A cash movement silently defaulting to branch 1 (a missing branch is now an error).
- A history column for the branch that was never written.
- Names that are not required to be unique.
- Two unused tables.

## 16. Open questions

| Question                                                                                                                                        | Owner                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Code derivation: keep exactly "lower case, spaces to underscores", or also remove accents and punctuation for new branches (stored codes stay)? | Ramiro                         |
| Do the live data contain duplicate branch names or codes?                                                                                       | Live schema check in Slice 0.3 |
| Reading office branches needs no special permission today: confirm that any signed-in staff may list them.                                      | Ramiro                         |
| Until users are assigned to office branches, may any signed-in user still choose any branch for a cash movement, as in the legacy system?       | Ramiro                         |
