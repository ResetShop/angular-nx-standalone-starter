# Legacy dictionary

An index of what the legacy system called things and the English name proposed for each, kept until the review of the
element's context accepts or replaces it. Accepted mappings move to the context document (section 10 of its template) and
the term to the [glossary](glossary.md); this file then only points there.

Entries are `proposed` or `accepted`. Every proposal is reviewed line by line by the owner before it is accepted.

## Notation

`legacy name → domain name → Postgres name`, for example
`sh_fix_repair.id_status → repairStatusId → repair.repair_status_id`. A legacy element that is not carried over says why.

## 1. Tables

Table names are decided per context in the review sessions. Known legacy tables:

| Legacy table                                                | Context             | Proposed name       | Status                                                                     |
| ----------------------------------------------------------- | ------------------- | ------------------- | -------------------------------------------------------------------------- |
| `sh_administration_office_branch`                           | Organization        | `office_branch`     | proposed; see [organization](domain/organization.md)                       |
| `sh_tab_transaction_type`                                   | Treasury            | `movement_type`     | proposed; see [treasury-reference-data](domain/treasury-reference-data.md) |
| `sh_tab_payment_methods`                                    | Treasury            | `payment_method`    | proposed; see [treasury-reference-data](domain/treasury-reference-data.md) |
| `sh_tab_payment_method_installments`                        | Treasury            | deferred to Stage 3 | proposed; see [treasury-reference-data](domain/treasury-reference-data.md) |
| `sh_tab_transaction_concept`                                | Treasury            | to be decided       | pending                                                                    |
| `sh_cash_transaction`                                       | Treasury            | to be decided       | pending                                                                    |
| `sh_fix_customer` (formerly `sh_fix_client`)                | Customers           | `customer`          | proposed                                                                   |
| `sh_fix_repair`                                             | Workshop            | `repair`            | proposed                                                                   |
| `sh_fix_repair_status_history`                              | Workshop            | to be decided       | pending                                                                    |
| `sh_fix_tab_status`                                         | Workshop            | `repair_status`     | proposed                                                                   |
| `sh_fix_transaction`                                        | Workshop / Treasury | owner to be decided | pending                                                                    |
| `user`, `role`, `user_role`                                 | Identity            | already migrated    | n/a                                                                        |
| `sh_administration_branch`, `sh_administration_user_branch` | Organization        | not carried over    | proposed; see [organization](domain/organization.md)                       |

## 2. Spanish → English terms

### Repairs

| Legacy term                              | Proposed name                           | Notes                                                                                                               |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `marca`                                  | `device_manufacturer`                   | Device columns are prefixed with their value object; stays free text until a later follow-up adds a reference table |
| `tipo_equipo`                            | `device_type_id` (lookup)               |                                                                                                                     |
| `modelo`                                 | `device_model`                          |                                                                                                                     |
| `imei`                                   | `device_identifier`                     | Holds an IMEI or a serial number; the kind of identifier is not stored, revisit after Stage 2                       |
| `problema`                               | `reported_issue`                        |                                                                                                                     |
| `nota`                                   | `note`                                  | Audience (staff or customer) decided in the Workshop review                                                         |
| `fecha_ingreso`                          | `received_at`                           | The moment the device was received                                                                                  |
| `fecha_reparacion_terminada`             | `finished_at`                           | Never written by the legacy code; word aligned with the `finished_*` repair statuses                                |
| `fecha_ultima_actualizacion`             | derived: time of the last status change | Overlaps `updated_at`; computed from the status history (confirmed in the Workshop review)                          |
| `senia_reparacion`                       | `deposit_amount`                        | The amount paid up front; "advance payment" was the first proposal                                                  |
| `precio_reparacion`                      | `price_amount`                          |                                                                                                                     |
| `costo_reparacion`                       | `cost_amount`                           |                                                                                                                     |
| `usuario_creador`, `usuario_modificador` | `created_by`, `updated_by`              |                                                                                                                     |
| `habilitado`, `eliminado`                | `status`                                | `record_status`; `deleted` wins, then not enabled → `disabled`, otherwise `active`                                  |
| `encendido`                              | `was_powered_on_at_intake`              | State when received, not current state                                                                              |
| `warranty_term`                          | `warranty_months`                       | Unit to be confirmed against the live data                                                                          |
| `id_status`                              | `repair_status_id`                      |                                                                                                                     |
| history `modified_date_tz`               | `closed_at`                             | Changes the meaning from "modified" to "end of the interval"; NULL marks the open row                               |

### Customers

| Legacy term                              | Proposed name              | Notes                                                     |
| ---------------------------------------- | -------------------------- | --------------------------------------------------------- |
| `nombre`                                 | `first_name`               |                                                           |
| `apellido`                               | `last_name`                |                                                           |
| `dni`                                    | `national_id_number`       | Argentine national identity document; DNI in the glossary |
| `telefono`, `telephone_number`           | `phone_number`             |                                                           |
| `direccion`                              | `address`                  |                                                           |
| `email`                                  | `email_address`            |                                                           |
| `birth_date`                             | `birth_date`               |                                                           |
| `fecha_creacion`, `fecha_modificacion`   | `created_at`, `updated_at` |                                                           |
| `usuario_creador`, `usuario_modificador` | `created_by`, `updated_by` |                                                           |
| `id_user`                                | `user_id`                  | Optional link to a customer account                       |

### Generic

| Legacy term                       | Proposed name | Notes                                        |
| --------------------------------- | ------------- | -------------------------------------------- |
| `enabled` + `deleted` (any table) | `status`      | `record_status` (see the naming conventions) |
| `id_<x>`, `<x>_id` foreign keys   | `<x>_id`      | Named after the referenced table             |
| `created_at`, `updated_at`        | same          | `timestamptz`; legacy values assumed UTC     |

## 3. Lookup values

Legacy lookup rows hold Spanish text. The new rows have an English `code` and `name`; the mapping is by legacy id and is
recorded per catalogue when its context is reviewed (repair statuses, movement types, device types, payment methods).
