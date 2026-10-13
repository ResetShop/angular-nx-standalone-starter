# Glossary

The single place to check a domain name. Every term used in code, contracts and documents has one entry here, written in
English. The glossary holds the **definition**; the mapping to legacy and Postgres names lives in the context document of
the term (section 10 of its template), and unreviewed legacy items live in the [legacy dictionary](legacy-dictionary.md).
Terms are added while each bounded context is reviewed.

## Entry format

| Field      | Meaning                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Term       | The ubiquitous name, singular, as it appears in code (`Repair`, `repair`)                                                 |
| Context    | The bounded context that owns the definition                                                                              |
| Kind       | Entity, aggregate root, value object, attribute, enum, lookup, reference data, policy, domain event, use case, read model |
| Definition | One or two sentences in plain English, without implementation detail; "not …" lists forbidden synonyms                    |
| Document   | Link to the context document where the term is modelled and mapped                                                        |
| Status     | `proposed`, `accepted` or `superseded`                                                                                    |

Rules: one row per term; a word with different meanings in two contexts gets one row per context; terms are alphabetical.

Two terms are reserved from the start, because the identity module and the business model both use "status":

- **Record status**: the lifecycle of a stored record (`active`, `disabled`, `deleted`), the `status` column.
- **Repair status**: the workflow state of a repair, a lookup referenced as `repair_status_id`.

## Terms

| Term                             | Context      | Kind           | Definition                                                                                                                         | Document                                                       | Status   |
| -------------------------------- | ------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------- |
| Movement type (`MovementType`)   | Treasury     | Lookup         | Whether a cash movement takes money out (`expense`) or brings money in (`income`). The set is reviewed in Stage 3.                 | [treasury-reference-data](domain/treasury-reference-data.md)   | proposed |
| Office branch (`OfficeBranch`)   | Organization | Entity         | A place where the business operates and records cash and repairs. Not "branch" alone, which collides with source-control branches. | [organization](domain/organization.md)                         | proposed |
| Office branch code (`code`)      | Organization | Attribute      | A short machine-readable name derived from the office branch name: lower case, spaces replaced by underscores.                     | [organization](domain/organization.md)                         | proposed |
| Payment method (`PaymentMethod`) | Treasury     | Reference data | The way a payment was made, such as cash or a card.                                                                                | [treasury-reference-data](domain/treasury-reference-data.md)   | proposed |
| Record status (`status`)         | Shared       | Enum           | The lifecycle of a stored record: `active`, `disabled` or `deleted`. Not the same as a workflow state such as the repair status.   | [naming conventions](naming-conventions.md#5-lifecycle-status) | accepted |

Exceptions: office branches have no record status or audit columns, and payment methods have no audit columns, until their Stage 3 follow-ups; see the Organization and Treasury reference data documents.
