<!-- Source: CLAUDE.md | Last updated: 2026-05-08 -->

# Generators Reference

This file briefs agents on the seven Nx generators shipped under `@resetshop/generators`. **Always prefer a generator over hand-rolling boilerplate** when the task fits one of the shapes below. Generators emit files that follow this project's conventions automatically — file naming, path structure, type imports, store builder block ordering, repository projection types, OpenAPI registration, etc. Hand-written equivalents drift on every dimension.

When in doubt, scan the executable specs (`packages/generators/src/generators/<name>/index.spec.ts`) — they enumerate the exact paths and content each generator produces.

---

## Decision tree

| Task                                                                 | Use this generator                          | Notes                                                                                |
| -------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Create a new app from the canonical template                         | `app`                                       | Only entry point — never copy `apps/reference-app` by hand                           |
| Add a new entity end-to-end (DB table → API → frontend store + page) | `crud`                                      | Orchestrates `drizzle-schema` + `backend-module` + `api-provider` + `store` + `page` |
| Add a new table to an existing module (no API yet)                   | `drizzle-schema`                            | One file: pgTable + relations + inferred types                                       |
| Add a new endpoint group to a backend module                         | `backend-module`                            | 5 files: routes, controller, repository, service, interfaces                         |
| Add a frontend API token + http impl + mock                          | `api-provider`                              | 4 files: interface (token), http impl, in-memory mock, `provideX()` function         |
| Add a NgRx Signal Store for an existing API                          | `store`                                     | 3 files: store, types (`State`/`ReadError`/`MutationError`), test spec               |
| Add a list page that uses an existing API + store                    | `page`                                      | Pass `--withStore=false --withApiProvider=false` to skip sub-generators              |
| Add a list page **and** wire its store + provider in one go          | `page` with `--withStore --withApiProvider` | Sub-generators run alongside the page                                                |

If the task spans more than one row above, prefer `crud` (it stitches the slice and emits all five layers in one invocation).

---

## Naming convention for the `name` argument

All generators accept either camelCase or snake_case input — both produce the same output via `@nx/devkit`'s `names()` helper:

| Input             | `className`      | `propertyName`   | `fileName`        | `constantName`    |
| ----------------- | ---------------- | ---------------- | ----------------- | ----------------- |
| `product`         | `Product`        | `product`        | `product`         | `PRODUCT`         |
| `productCatalog`  | `ProductCatalog` | `productCatalog` | `product-catalog` | `PRODUCT_CATALOG` |
| `order_line_item` | `OrderLineItem`  | `orderLineItem`  | `order-line-item` | `ORDER_LINE_ITEM` |

All file paths produced by every generator are **kebab-case** (`order-line-item.ts`); JS identifiers inside generated files are **camelCase** (`orderLineItem`); types are **PascalCase** (`OrderLineItem`).

---

## Per-generator details

### `app`

> Generate a new Angular app pre-wired to `@resetshop/*` packages.

- **Invocation:** `npm run generate:app -- --name="My App"` (the only generator with an `npm run` wrapper, because it enforces canonical-template constraints).
- **Inputs:** `name` (required, human-readable display name; gets slugified). `directory` (default `apps`).
- **Output:** clones `apps/reference-app` into `apps/<slug>` with text files rewritten (slug substituted everywhere `reference-app` appears, `<title>` set to display name, `scope:starter` rewritten to `scope:app`, `IMPORT_MIGRATION.md` excluded). Binary files copied byte-for-byte.
- **Validation:** rejects empty/whitespace-only names, names that produce no slug (`!!!`), names that match reserved tooling slugs (`node`, `dist`), and the literal `reference-app`. Also throws if `apps/<slug>` already exists or if `apps/reference-app` is missing.
- **Hard rule:** `apps/reference-app` is upstream-owned and must never be modified by forks. Never create a new app by hand-copying `apps/reference-app`, scaffolding from `nx g @nx/angular:application`, or modifying `apps/reference-app` directly. See `docs/forking.md`.
- **Spec:** `packages/generators/src/generators/app/index.spec.ts` (15 tests, including `slugifyAppName` unit tests).

### `crud`

> Generate a full CRUD vertical slice (schema + backend + provider + store + page).

- **Invocation:** `nx g @resetshop/generators:crud product --module=catalog`.
- **Inputs:** `name` (required), `module` (required-by-convention; the parent backend module — defaults to `''`), `appRoot` (default `apps/reference-app`).
- **Output:** orchestrates four sub-generators. For `product` in `catalog` under `apps/reference-app`:
  - `apps/reference-app/src/db/schema/product.ts` (drizzle-schema)
  - `apps/reference-app/src/api/modules/catalog/product/{*.controller.ts, *.repository.ts, *.routes.ts, *.service.ts, interfaces.ts}` (backend-module)
  - `apps/reference-app/src/app/providers/product/{*.ts, *.interface.ts, *.mock.ts, *.provider.ts}` (api-provider)
  - `apps/reference-app/src/app/store/product/{*.store.ts, *.store.spec.ts, *.types.ts}` (store)
  - `apps/reference-app/src/app/pages/dashboard/product/product-list/{*.ts, *.spec.ts}` (page, with `withStore=false withApiProvider=false`)
- **Post-step (the generator logs these as TODOs):**
  1. Add the route to `<appRoot>/src/app/pages/dashboard/dashboard.routes.ts`
  2. Add a navigation entry to the `NavigationConfig`
  3. Register the new schema in the drizzle connector at `apps/reference-app/src/db/schema/all.ts`
- **Spec:** `packages/generators/src/generators/crud/index.spec.ts`.

### `drizzle-schema`

> Generate a Drizzle table schema with optional relations.

- **Invocation:** `nx g @resetshop/generators:drizzle-schema product`.
- **Inputs:** `name` (required), `directory` (default `src/db/schema`).
- **Output:** one file at `<directory>/<kebab-case>.ts` containing `pgTable(...)`, `relations(...)`, and inferred `Type`/`NewType` exports.
- **Convention note:** the generated `pgTable('orderLineItem', ...)` uses the camelCase JS identifier as the table-name string. Existing schemas in `apps/reference-app/src/db/schema/` use snake_case strings (`pgTable('order_line_item', ...)`). Discrepancy is known; rename by hand for new tables that must match the existing convention.
- **Don't use it when:** the table needs custom column types beyond `serial`/`varchar`/`boolean`/`timestamp`, multiple unique indexes, or composite foreign keys. The template emits a minimal scaffold and is not a full schema-design tool.
- **Spec:** `packages/generators/src/generators/drizzle-schema/index.spec.ts`.

### `backend-module`

> Generate a Hono backend module (routes, controller, service, repository).

- **Invocation:** `nx g @resetshop/generators:backend-module product --module=catalog`.
- **Inputs:** `name` (required), `module` (default `''`; the parent module path), `directory` (default `src/api/modules`).
- **Output:** five files at `<directory>/<module>/<kebab-case>/` (or `<directory>/<kebab-case>/` if `module` is empty):
  - `<kebab-case>.routes.ts` — `createRoute()` definitions for `list*` and `get*` endpoints
  - `<kebab-case>.controller.ts` — `registerRoute()` handlers wired to the service
  - `<kebab-case>.repository.ts` — `Drizzle<Class>Repository extends BaseRepository`
  - `<kebab-case>.service.ts` — `<Class>Service` with `getAll<Class>s` / `get<Class>` methods
  - `interfaces.ts` — `<Class>Repository`, `<Class>Service`, `List<Class>sParams`, `<Class>ServiceDeps`
- **Don't forget:** the new module router (`index.ts`) and Awilix container registration are NOT generated. Wire them by hand into `src/api/routes.ts` and `src/api/container/container.ts` after running.
- **Spec:** `packages/generators/src/generators/backend-module/index.spec.ts`.

### `api-provider`

> Generate a frontend API provider (interface, Http impl, mock, provider function).

- **Invocation:** `nx g @resetshop/generators:api-provider product`.
- **Inputs:** `name` (required), `directory` (default `src/app/providers`).
- **Output:** four files at `<directory>/<kebab-case>/`:
  - `<kebab-case>.interface.ts` — `<Class>Api` TypeScript interface + `InjectionToken<<Class>Api>`
  - `<kebab-case>.ts` — `Http<Class>Api implements <Class>Api` with `@Injectable({ providedIn: 'root' })`
  - `<kebab-case>.mock.ts` — `InMemory<Class>Api implements <Class>Api` + `provide<Class>Mock()`
  - `<kebab-case>.provider.ts` — `provide<Class>()` returning `EnvironmentProviders` via `makeEnvironmentProviders`
- **Don't forget:** the methods on the interface and on `Http<Class>Api` / `InMemory<Class>Api` are TODO stubs. The generator's job is the boilerplate (token + provider function + mock skeleton); method bodies are application work.
- **Spec:** `packages/generators/src/generators/api-provider/index.spec.ts`.

### `store`

> Generate a NgRx Signal Store following project conventions.

- **Invocation:** `nx g @resetshop/generators:store product`.
- **Inputs:** `name` (required), `directory` (default `src/app/store`), `project` (declared in schema, currently unused).
- **Output:** three files at `<directory>/<kebab-case>/`:
  - `<kebab-case>.store.ts` — `<Class>Store` via `signalStore(...)` with `withState`, `withComputed`, `withMethods`, `withHooks`. Block ordering matches CLAUDE.md's "Store builder block structure" rule.
  - `<kebab-case>.types.ts` — `<Class>State`, `<Class>ReadError`, `<Class>MutationError`, `initial<Class>State`
  - `<kebab-case>.store.spec.ts` — Angular Testing Library-style spec scaffolding with `clearAllMocks()` and `fn()` from `@test-utils`
- **Don't forget:** the API-token consumption (`inject(<Class>Api)`) is TODO-commented in the generated store; uncomment after running `api-provider` (or use `crud`, which runs both).
- **Spec:** `packages/generators/src/generators/store/index.spec.ts`.

### `page`

> Generate a route page component with optional store and API provider.

- **Invocation:** `nx g @resetshop/generators:page product --withStore --withApiProvider`.
- **Inputs:** `name` (required), `route` (optional, defaults to `n.fileName` for the route-registration log message), `withStore` (default `false`), `withApiProvider` (default `false`), `directory` (default `src/app/pages/dashboard`).
- **Output (page only):** two files at `<directory>/<kebab-case>/<kebab-case>-list/`:
  - `<kebab-case>-list.ts` — standalone Angular component using `app-page-shell` and `TranslatePipe`
  - `<kebab-case>-list.spec.ts` — `@testing-library/angular` render scaffolding
- **Output (`--withApiProvider`):** also runs `api-provider` at `<directory>/../../providers/<kebab-case>/`.
- **Output (`--withStore`):** also runs `store` at `<directory>/../../store/<kebab-case>/`.
- **Known limitation — sibling path coupling:** the `../../providers` and `../../store` walk-up segments assume `directory` is exactly `src/app/pages/dashboard` (depth 4). Shallower directories under-walk: e.g. `directory: src/app/admin` produces sibling files at `src/providers/...` and `src/store/...`, NOT `src/app/providers/...`. The locked-in test in `page/index.spec.ts` asserts this behaviour. Stick with the default `directory` unless you also disable the sub-generators.
- **Don't forget:** the route registration is logged as guidance, not auto-wired. Add the suggested `{ path: '<route>', loadComponent: ... }` entry to `dashboard.routes.ts` by hand after running.
- **Spec:** `packages/generators/src/generators/page/index.spec.ts`.

---

## Cross-references

- `packages/generators/generators.json` — authoritative one-line description for each generator, used by `nx g --help`.
- `packages/generators/src/generators/<name>/index.spec.ts` — executable specs (60 tests across all 7).
- `packages/generators/src/generators/<name>/schema.json` — JSON schema for each generator's CLI options, including defaults.
- `README.md` "Generators" section — human-facing version of the decision tree (shorter than this file).
- `CLAUDE.md` "Canonical App Creation Workflow" — the `app` generator's rationale.
- `docs/forking.md` — the broader fork-distribution model that the `app` generator enforces.
