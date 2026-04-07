# Import Path Migration Map

When migrating `apps/reference-app/` to use the new package/library imports,
apply these replacements systematically. Run `typecheck` after each group.

## Group 1: Contracts (libs/contracts)

| Old                       | New                            |
| ------------------------- | ------------------------------ |
| `@contracts/auth/*`       | `@libs/contracts/auth/*`       |
| `@contracts/common/*`     | `@libs/contracts/common/*`     |
| `@contracts/permission/*` | `@libs/contracts/permission/*` |
| `@contracts/role/*`       | `@libs/contracts/role/*`       |
| `@contracts/user/*`       | `@libs/contracts/user/*`       |

## Group 2: Utilities (@resetshop/util)

| Old               | New                          |
| ----------------- | ---------------------------- |
| `@utils/duration` | `@resetshop/util`            |
| `@utils/logger`   | `@resetshop/util`            |
| `@utils/slug`     | `@resetshop/util`            |
| `@test-utils`     | `@resetshop/util/test-utils` |

## Group 3: UI Components (@resetshop/ui)

| Old                             | New                               |
| ------------------------------- | --------------------------------- |
| `@components/alert/*`           | `@resetshop/ui/alert/*`           |
| `@components/badge/*`           | `@resetshop/ui/badge/*`           |
| `@components/button/*`          | `@resetshop/ui/button/*`          |
| `@components/card/*`            | `@resetshop/ui/card/*`            |
| `@components/combobox/*`        | `@resetshop/ui/combobox/*`        |
| `@components/confirm-dialog/*`  | `@resetshop/ui/confirm-dialog/*`  |
| `@components/data-table/*`      | `@resetshop/ui/data-table/*`      |
| `@components/drawer/*`          | `@resetshop/ui/drawer/*`          |
| `@components/form-field/*`      | `@resetshop/ui/form-field/*`      |
| `@components/loading-spinner/*` | `@resetshop/ui/loading-spinner/*` |
| `@components/navigation-card/*` | `@resetshop/ui/navigation-card/*` |
| `@components/pagination/*`      | `@resetshop/ui/pagination/*`      |
| `@components/select/*`          | `@resetshop/ui/select/*`          |
| `@components/spinner/*`         | `@resetshop/ui/spinner/*`         |

Components that stay as `@components/*` (app-shell, NOT in @resetshop/ui):

- `@components/brand/*`
- `@components/breadcrumb/*`
- `@components/header/*`
- `@components/nav-item/*`
- `@components/nav-section/*`
- `@components/page-shell/*`
- `@components/sidebar/*`
- `@components/theme-toggle/*`
- `@components/toast/*` (toast-bridge, toast-notification, toast.provider)
- `@components/app-loading-shell/*`

## Group 4: Angular Core (@resetshop/angular-core)

| Old                                       | New                                                    |
| ----------------------------------------- | ------------------------------------------------------ |
| `@providers/i18n/translation`             | `@resetshop/angular-core/i18n/translation`             |
| `@providers/i18n/translate.pipe`          | `@resetshop/angular-core/i18n/translate.pipe`          |
| `@providers/i18n/translations.schema`     | `@resetshop/angular-core/i18n/translations.schema`     |
| `@providers/i18n/translation.initializer` | `@resetshop/angular-core/i18n/translation.initializer` |
| `@providers/i18n/translation.provider`    | `@resetshop/angular-core/i18n/translation.provider`    |
| `@providers/theme/*`                      | `@resetshop/angular-core/theme/*`                      |
| `@providers/navigation/*`                 | `@resetshop/angular-core/navigation/*`                 |
| `@providers/logger/*`                     | `@resetshop/angular-core/logger/*`                     |
| `@interfaces/navigation`                  | `@resetshop/angular-core/interfaces/navigation`        |
| `@interfaces/project`                     | `@resetshop/angular-core/interfaces/project`           |
| `@store/utils/extract-error-message`      | `@resetshop/angular-core/store/extract-error-message`  |

## Group 5: Data Access (libs/data-access)

| Old                                | New                                                 |
| ---------------------------------- | --------------------------------------------------- |
| `@providers/auth/*`                | `@libs/data-access/providers/auth/*`                |
| `@providers/users/*`               | `@libs/data-access/providers/users/*`               |
| `@providers/roles/*`               | `@libs/data-access/providers/roles/*`               |
| `@providers/permissions/*`         | `@libs/data-access/providers/permissions/*`         |
| `@providers/analytics/*`           | `@libs/data-access/providers/analytics/*`           |
| `@providers/project/*`             | `@libs/data-access/providers/project/*`             |
| `@providers/i18n/translation.mock` | `@libs/data-access/providers/i18n/translation.mock` |
| `@providers/i18n/translations/en`  | `@libs/data-access/providers/i18n/translations/en`  |
| `@providers/i18n/translations/es`  | `@libs/data-access/providers/i18n/translations/es`  |
| `@store/auth/*`                    | `@libs/data-access/store/auth/*`                    |
| `@store/users/*`                   | `@libs/data-access/store/users/*`                   |
| `@store/roles/*`                   | `@libs/data-access/store/roles/*`                   |
| `@store/permissions/*`             | `@libs/data-access/store/permissions/*`             |
| `@store/ui/*`                      | `@libs/data-access/store/ui/*`                      |
| `@domain/*`                        | `@libs/data-access/domain/*`                        |
| `@mocks/*`                         | `@libs/data-access/mocks/*`                         |

## Group 6: Backend (packages/hono-core) — COMPLETED

Backend files in `apps/reference-app/src/api/` previously used relative imports
into a local `openapi-app.ts`. The reusable backend infrastructure now lives in
the `@resetshop/hono-core` package, and these imports were migrated as part of
PLAN.md Step 0 (deduplication audit, see `workspace/DEDUP_AUDIT.md`).

| Old (relative)                         | New                    | Status   |
| -------------------------------------- | ---------------------- | -------- |
| `../../openapi-app`                    | `@resetshop/hono-core` | Migrated |
| `./utils/environment` (`isServerless`) | `@resetshop/hono-core` | Migrated |

`@schema/*` and `../middlewares/*` remain as project-local path aliases /
relative imports because they are app-owned, not starter-owned.

## Execution order

Groups 1 → 2 → 3 → 4 → 5 → 6 have all been applied. This document is retained
as a historical record of the migration.
