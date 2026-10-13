# Brillante backend — domain documentation

This folder holds the product documentation of the Brillante platform replacement: the ubiquitous language, the naming
rules and, as they are produced, the domain model of each bounded context and the architecture decisions. It versions
with the code.

The effort has three stages. **Stage 1** rebuilds the legacy backend as domain-driven modules that read and write the
legacy MySQL database. **Stage 2** moves the data to Postgres under the names defined here and launches the new platform.
**Stage 3** removes MySQL and the legacy system. The working plan, the status board and the decision log are kept outside
the repository; every decision that matters is written into the documents below with its date. Tracking issue:
[#639](https://github.com/ResetShop/angular-nx-standalone-starter/issues/639).

| Document                                         | What it is                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [`naming-conventions.md`](naming-conventions.md) | The rules every table, column, type and API name follows                                |
| [`lookup-tables.md`](lookup-tables.md)           | How closed catalogues are stored, referenced, translated and deprecated                 |
| [`glossary.md`](glossary.md)                     | Every domain term: one entry per term, the single place to check a name                 |
| [`legacy-dictionary.md`](legacy-dictionary.md)   | Index of legacy names and their proposed English names, until each context accepts them |
| [`domain/_TEMPLATE.md`](domain/_TEMPLATE.md)     | The template of a bounded context document                                              |
| `domain/<context>.md`                            | One document per bounded context (added as each context is reviewed)                    |

Planned, produced by the architecture decisions: the backend layering and folder layout, the Money and time value
objects, repository ports and units of work, domain events, and the API and contract conventions.

The codebase is English-first: names, code, documents and tests are in English. Spanish exists only in user-facing text
(the frontend translations and the email templates).
