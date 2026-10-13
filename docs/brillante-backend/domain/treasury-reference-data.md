# Treasury reference data

> Status: draft · Last reviewed: 2026-10-13 · Reviewers: Ramiro
> Decisions are recorded with their date in section 14.

## 1. Purpose

Treasury records money coming in and going out. This part of the context holds the small tables that classify a cash
movement: whether it is an expense or an income (the **movement type**) and how it was paid (the **payment method**).

This document covers the reference data of Treasury only. It is not responsible for the movement concept tree, for cash movements themselves, or for installment plans, which are
deferred (section 14).

## 2. Relationships with other contexts

| Context  | Direction         | What crosses the boundary                                                                                        | Translation needed |
| -------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------ |
| Workshop | Treasury upstream | A repair payment refers to a payment method by id when it becomes a cash movement.                               | none               |
| Products | deferred          | The legacy installment plans served the product price quote. They return with the products project (section 14). | none               |

References from other contexts are by id only.

## 3. Ubiquitous language

- **Movement type** (`MovementType`): whether a cash movement takes money out (`expense`) or brings money in (`income`).
- **Payment method** (`PaymentMethod`): the way a payment was made, such as cash, a bank transfer or a card terminal.

Both are proposed in the [glossary](../glossary.md).

## 4. Aggregates and entities

Neither is an aggregate: both are reference data. Other contexts refer to a payment method by `id` (staff-managed data) and the domain refers to a movement type by `code`. `MovementType` is served by a reference-data port, not a repository; `PaymentMethodRepository` is a plain-record repository like `OfficeBranchRepository`.

### MovementType

| Field      | Content                                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name       | `MovementType`                                                                                                                                            |
| Identity   | Surrogate `id`; `code` is the natural key                                                                                                                 |
| Boundary   | The record alone                                                                                                                                          |
| Kind       | Closed system-defined lookup (see [lookup tables](../lookup-tables.md))                                                                                   |
| Properties | `id`, `code` (`expense`, `income`), `name` (English), `status` (`active` / `disabled`), timestamps                                                        |
| Invariants | `code` is immutable and unique                                                                                                                            |
| Lifecycle  | `active` / `disabled`; never deleted                                                                                                                      |
| Behaviour  | None; seeded by migration                                                                                                                                 |
| Uniqueness | `code` is globally unique                                                                                                                                 |
| Rule       | Assumption to confirm in the concept and cash-movement reviews: a cash movement's type is that of its concept, and the movement stores no type of its own |

The two codes are provisional: the set is reviewed after the migration because two fixed values may constrain later
features and relations (section 14).

### PaymentMethod

A **hybrid table**: staff-managed data (new methods, such as bank accounts, are added over time) that may contain rows the
domain must recognise.

| Field      | Content                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name       | `PaymentMethod`                                                                                                                                                                            |
| Identity   | Surrogate `id`; `name` is also unique                                                                                                                                                      |
| Boundary   | The record alone                                                                                                                                                                           |
| Properties | `id`; `name` (required, unique, stored as typed by staff and never translated); `code` (nullable, unique, only for rows the domain recognises, such as `cash`); `status` (`record_status`) |
| Invariants | The name is not empty and unique; a code, when present, is immutable                                                                                                                       |
| Lifecycle  | `active`, `disabled` or `deleted`. Disabled methods stay visible on existing movements and cannot be chosen for new payments                                                               |
| Behaviour  | None in this stage: the table is read-only through the API. Adding and editing methods is a Stage 3 follow-up                                                                              |
| Uniqueness | `name` is globally unique; `code`, when present, is globally unique                                                                                                                        |

The audit columns (`created_at`, `updated_at`, `created_by`, `updated_by`) are omitted until the Stage 3 follow-up, a declared exception recorded in section 14.

## 5. Value objects

None. The interest rate and the installment count belong to the installment plans and are deferred with them.

## 6. Lookups and reference data

| Table            | Kind                   | Notes                                                                    |
| ---------------- | ---------------------- | ------------------------------------------------------------------------ |
| `movement_type`  | Closed lookup          | `expense`, `income`; served by the `MovementTypes` port                  |
| `payment_method` | Hybrid (staff-managed) | Rows referred to by code: at least `cash` (used by the register opening) |

## 7. Repository ports

- `MovementTypes` (reference-data port): `findAllActive()`, `findAll()`, `findByCode(code)`.
- `PaymentMethodRepository`: `findAllActive()` (for choosing a method for new payments), `findAll()` (administrators, and
  displaying existing movements), `findById(id)`, `findByCode(code)`.

## 8. Use cases

| Use case              | Actor                                     | Input | Steps                                                      | Aggregates touched | Transaction | Events | Errors                           |
| --------------------- | ----------------------------------------- | ----- | ---------------------------------------------------------- | ------------------ | ----------- | ------ | -------------------------------- |
| ListMovementTypes     | Any signed-in staff                       | none  | Return the active types                                    | none               | read only   | none   | none                             |
| ListPaymentMethods    | Any signed-in staff                       | none  | Return the active methods                                  | none               | read only   | none   | none                             |
| ListAllPaymentMethods | Staff allowed to read all payment methods | none  | Return every method that is not `deleted`, with its status | none               | read only   | none   | Forbidden without the permission |

## 9. Policies

- **`canChoosePaymentMethod(method)`:** only an `active` method can be chosen for new work. A method that is not `active` is refused when recording a payment, and still shown on existing movements.

## 10. Legacy mapping

| Legacy element                       | Domain element   | Postgres element | Notes                                                                                                                                     |
| ------------------------------------ | ---------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `sh_tab_transaction_type`            | `MovementType`   | `movement_type`  | Columns `transaction_type_id` and `description`: the id maps to the code (0 `expense`, 1 `income`) and the Spanish description is ignored |
| `sh_tab_payment_methods`             | `PaymentMethod`  | `payment_method` | Ids preserved                                                                                                                             |
| `.payment_method_id`                 | `id`             | `id`             |                                                                                                                                           |
| `.description`                       | `name`           | `name`           | Kept as typed (Spanish); unique in the legacy table                                                                                       |
| `.allows_installments`               | none             | none             | Dropped with the installment plans                                                                                                        |
| `.enabled`, `.deleted`               | `status`         | `status`         | Deleted wins, then not enabled, else active. Provisional until the live check: methods 3, 7 and 8 are disabled and become `disabled`      |
| (new)                                | `code`           | `code`           | Seeded only for recognised rows, such as `cash` (id 1)                                                                                    |
| `sh_tab_payment_method_installments` | not carried over | none             | Deferred (section 14)                                                                                                                     |

## 11. Stage 1 bridge

- Movement types: the bridge schema reads `sh_tab_transaction_type` and an explicit id→code map in the infrastructure layer (0 → `expense`, 1 → `income`) produces the codes.
- The stale schema dump has no `enabled` / `deleted` columns for payment methods; the live columns are read in Slice 0.3.
- The bridge restores the filter the legacy API had: the plain listing returns only active methods.

## 12. Permissions and API contracts

| Operation             | Endpoint (proposed)                   | Permission (proposed; final names in the authorization slice) |
| --------------------- | ------------------------------------- | ------------------------------------------------------------- |
| ListMovementTypes     | `GET /api/movement-types`             | Any signed-in staff                                           |
| ListPaymentMethods    | `GET /api/payment-methods`            | Any signed-in staff                                           |
| ListAllPaymentMethods | `GET /api/payment-methods?status=all` | `treasury:payment-method:read-all`                            |

Contracts: `MovementType { code, name }`, `PaymentMethod { id, name, code, status }`.

## 13. Domain events

None.

## 14. Decisions

| Date       | Decision                                                                                                                                                 | Alternatives considered                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 2026-10-13 | Movement type is a closed lookup (`expense`, `income`) for now; the set is reviewed in Stage 3 because two fixed codes may be too tight                  | Staff-managed from the start                     |
| 2026-10-13 | Payment method is a staff-managed hybrid table; adding methods through the system is a Stage 3 follow-up; naming stays `payment_method` for now          | A closed lookup                                  |
| 2026-10-13 | Installment plans, `allows_installments`, the interest rate and the installment count are not modelled now; all return in Stage 3 with the products work | Read-only plan table; plans as part of a payment |
| 2026-10-13 | `payment_method` has no audit columns until the Stage 3 follow-up (an exception to the audit rule, like `office_branch`)                                 | Adding them now                                  |
| 2026-10-13 | Administrators can list disabled payment methods; new payments only accept active ones                                                                   | Hiding disabled methods from everyone            |

## 15. Legacy defects deliberately not kept

- The interim rewrite that listed disabled methods to everyone.
- The hardcoded movement type values and payment method ids in code.
- Quoting prices by looking up the method whose description is "LaPos Crédito".

## 16. Open questions

| Question                                                                                                         | Owner                |
| ---------------------------------------------------------------------------------------------------------------- | -------------------- |
| Which payment method rows does the domain recognise by code besides `cash` (the register opening uses method 1)? | Ramiro               |
| Are payment method names unique in the live data, and what are methods 12 and 13?                                | Slice 0.3 live check |
| Should the movement type codes stay `expense` and `income` after the Stage 3 review?                             | Ramiro, Stage 3      |
