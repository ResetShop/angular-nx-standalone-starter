# Lookup tables

A lookup table stores a **closed, system-defined catalogue** such as the repair statuses or the device types. The
catalogue is changed only by us, through a migration, never by staff at runtime. A lookup row is a reference-data entity
with an identity and a lifecycle; its `code` is the value the domain works with.

## 1. What is and is not a lookup

| It is a lookup table                                               | It is not                                                                                    |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Values defined by the business model and changed only by a release | Data staff create and edit (movement concepts, office branches): ordinary tables             |
| Values the domain code branches on or labels in the UI             | The lifecycle `status` (`active`, `disabled`, `deleted`): the shared `record_status` enum    |
| Values that need a stable machine name and a translated label      | Values that belong to one row of another table (installment plans: data of a payment method) |

Initial inventory, to be confirmed in the review sessions of each context: repair status, device type, movement type,
payment method.

**Hybrid tables.** An ordinary table staff edit may still contain rows the domain must recognise (for example the movement
concept used for the register opening). Such a table gets a nullable, unique `code` column for the system-significant
rows only. Whether payment method is a lookup or such a hybrid table is decided in the Treasury review.

## 2. Shape

```
<name>
  id           serial primary key
  code         text not null               -- unique (<table>_code_key); stable English machine name: 'finished_and_paid'
  name         text not null               -- English name for tools and logs; the label shown to users is the translation of code
  status       record_status not null      -- 'active' | 'disabled' only
  sort_order   integer                     -- optional, for display
  <flags>      boolean                     -- optional behaviour flags: is_final, allows_installments, …
  created_at   timestamptz not null
  updated_at   timestamptz not null
```

- `id` follows the key rule of the [naming conventions](naming-conventions.md); other tables reference it as `<name>_id`
  (`repair.repair_status_id`).
- Constraints on every lookup table: the unique key `<table>_code_key`, `CHECK (code ~ '^[a-z][a-z0-9_]*$')` and `CHECK (status <> 'deleted')`, named `<table>_code_check` and `<table>_status_check`.
- `code` is **immutable once released**. A rename is a new row and a data migration, because code, translations and stored
  references depend on it.
- Behaviour the domain used to infer from hardcoded id sets becomes a **flag or a column of the row** (for example whether a
  repair status is final), so the rule lives with the data it describes. Whether a flag is part of the API response is
  decided with the API conventions; the default response is `{ code, name }`.
- Lookup rows are seeded by migration and carry no `created_by` / `updated_by`.
- Seed migrations never hardcode serial ids: child rows are inserted with `(SELECT id FROM <name> WHERE code = '…')`.
  Where the data move keeps legacy ids, the sequence is moved past the highest id afterwards.

## 3. How code refers to a row

- The domain refers to rows by `code`. The set of codes the code knows is a frozen constant (a union type of the codes), so
  the domain can branch on it. What is not allowed is a numeric id in code, a database enum for a business catalogue, or an
  `enum` declaration.
- An aggregate holds the `code` of a catalogue value as a small value object; it does not load the lookup row.
- A **reference-data port** per lookup (not a repository: repositories belong to aggregates) offers two operations:
  - `findAllActive()`: the rows that may be chosen for new work;
  - `findAll()` / `findByCode()`: any row regardless of status, used to read and display existing records.
- A startup check fails fast only when a code the code knows is **missing** from the table (any status). Extra rows in the
  table are logged as a warning, so a migration that adds a row can deploy before the code that uses it.
- The API returns `{ code, name }`. The frontend shows the translation of `code` (for example the key
  `LOOKUP.REPAIR_STATUS.FINISHED_AND_PAID`); it never displays database text.

## 4. Deprecating a value

A catalogue value is never deleted and never renumbered: old rows and history keep referring to it. To stop using it, set
its `status` to `disabled`. The domain refuses disabled values for new work (new repairs, new payments, new transitions)
and keeps displaying them in existing records. Re-enabling is setting `status` back to `active`.

## 5. Stage 1: legacy databases and missing lookups

During Stage 1 the legacy MySQL database cannot be changed, so:

- Catalogues that exist in MySQL (repair status, movement type, payment method) are read through the bridge schemas; the
  repository maps each **legacy id to a `code`** with an explicit table kept in the infrastructure layer. The Spanish text
  in those rows is ignored.
- Catalogues that have no MySQL table (device type) are served by a **static adapter** behind the same port.
- The lookup tables are created in Postgres in Stage 2; the data move maps rows by legacy id, never by Spanish text, and
  states whether ids are preserved or mapped.
- The legacy `enabled` / `deleted` flags of a catalogue row map to its `status`: a legacy-deleted catalogue row becomes
  `disabled`, because a lookup row is never `deleted`.

## 6. Translations

Only system-defined catalogues are translated (see [naming conventions](naming-conventions.md#11-translations)). Entries
that staff type themselves, such as movement concepts and office branches, are shown exactly as stored.
