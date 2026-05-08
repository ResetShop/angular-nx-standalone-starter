# Changelog

All notable changes to this starter are documented here. Forks should read this file before every upstream merge — it is the single source of truth for what changed upstream and whether any of those changes affect fork-owned code or require migration work.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). Versioning cadence: **every fork-visible breaking change cuts a new version**; non-breaking changes accumulate under `## [Unreleased]` until the next breaking change forces a new release. A "fork-visible breaking change" is anything that requires a fork to take action during a merge — removed files, renamed APIs, changed schemas, restructured directories, or modified contracts. Pre-1.0 versions use the `1.0.0-beta.N` numbering convention while the fork-distribution model is being stabilized.

## [Unreleased]

### Changed

- **Generators are now documented for both humans and agents.** Added a new "Generators" section to `README.md` (Project Setup Guide) that enumerates all seven generators with their `nx g @resetshop/generators:<name>` invocation and a one-line "use when" description, plus disambiguation guidance for choosing between `crud` and the narrower single-layer generators. Added a new agent-facing reference at `.claude/references/generators.md` covering each generator's exact output, naming conventions (the `names()` helper produces kebab-case file paths, camelCase JS identifiers, PascalCase types from any input form), known limitations (page generator's `../../providers` and `../../store` walk-up only resolves correctly from the default `src/app/pages/dashboard` directory; drizzle-schema's `pgTable('orderLineItem', ...)` string differs from the snake_case convention used in existing schemas), and links to each generator's executable spec. Wired the new reference into the Step 0 load list of `architecture-advisor`, `plan-writer`, and `code-reviewer` so agents see it during planning and review. Replaced the "as they get adopted" weasel-wording in CLAUDE.md's Nx Generators subsection with a list of every generator and a pointer to the deeper reference. ([#333](https://github.com/ResetShop/angular-nx-standalone-starter/issues/333))
- **Local integration tests now run zero-config via `embedded-postgres`.** When `PG_TEST_CONNECTION_STRING` is unset, `apps/reference-app/src/api/integration/setup/global-setup.ts` spawns a real Postgres 17 cluster on a free localhost port via the [`embedded-postgres`](https://www.npmjs.com/package/embedded-postgres) package (official EnterpriseDB binaries shipped by the package, downloaded once at `npm install` time and cached in `node_modules`), pushes the schema, seeds base data, runs the suite, and tears the cluster down on teardown. CI behavior is unchanged — it still sets `PG_TEST_CONNECTION_STRING` to its `postgres:17` service container, so the embedded path is skipped. New file `apps/reference-app/src/api/integration/setup/embedded-pg-test-db.ts` owns the cluster lifecycle (free-port allocation, init + start + stop). The existing `drizzle-postgres-connector.ts`, `db-helpers.ts`, `env-helpers.ts`, and `integration-setup.ts` are untouched. `scripts/skip-if-no-db.mjs` removed and the `apps/reference-app/project.json` `test-integration` target dropped its skip-prefix — the gate is meaningless now that local runs always have a DB. ([#321](https://github.com/ResetShop/angular-nx-standalone-starter/issues/321))
- **`embedded-postgres` devDependency** added — ships official EnterpriseDB Postgres 17 binaries used to spawn a real Postgres cluster locally for integration tests with no Docker daemon required. ([#321](https://github.com/ResetShop/angular-nx-standalone-starter/issues/321))
- **`apps/reference-app/src/app/guards/permission.guard.ts`** — emits a translated toast (`PERMISSIONS.ERRORS.ACCESS_DENIED`) via `UIStore.showNotification` when denying access, instead of silently redirecting to `/dashboard`. Mirrors the `forbidden.interceptor.ts` 403 toast pattern so users get consistent feedback whether the deny happens at the route layer or the HTTP layer. The redirect target `/dashboard` is gated by `authGuard`, not `permissionGuard`, so the toast fires exactly once per deny — verified by `permission.guard.spec.ts`. New translation key `PERMISSIONS.ERRORS.ACCESS_DENIED` added to `translations.schema.ts`, `en.ts`, and `es.ts`. ([#323](https://github.com/ResetShop/angular-nx-standalone-starter/issues/323))
- **`apps/reference-app/src/app/pages/dashboard/pages/dashboard-home/dashboard-home.ts`** — renders an explicit "No module access" alert at the top of the page when the current user holds zero permissions (`AuthStore.userPermissions().length === 0`). Previously such users saw only the unguarded Welcome / Settings / Health cards with no explanation of why the admin modules weren't visible; the alert now tells them to contact their administrator. The alert is additive — the unguarded cards still render below it. New translation keys `DASHBOARD.HOME.NO_ACCESS_TITLE` and `DASHBOARD.HOME.NO_ACCESS_MESSAGE` added to `translations.schema.ts`, `en.ts`, and `es.ts`. New `dashboard-home.spec.ts` covers both the visible and hidden cases. ([#323](https://github.com/ResetShop/angular-nx-standalone-starter/issues/323))
- **`POST /api/auth/login` and `GET /api/auth/me` response shape** — login response now includes the user's full roles with their permissions, mirroring `/api/auth/me`. The shared `authUserSchema` (`apps/reference-app/src/contracts/user/user.schemas.ts`) gained a `roles: z.array(roleWithPermissionsSchema)` field; `meResponseSchema` (`apps/reference-app/src/contracts/auth/auth.schemas.ts`) is now `meResponseSchema = authUserSchema`, replacing a 5-field inline duplicate. Backend `AuthService.authenticate` injects `userRoleService` and populates roles before returning. Frontend `mapLoginResponseToUser` reads `response.user.roles`, eliminating the "empty-roles window" that previously existed between login and the first protected-route activation (the symptom: permission-guarded sidebar items missing on re-login after token expiry). `validateSession()` (called by `authGuard` on `/dashboard`) still runs and refreshes the user, but is no longer the sole source of role data after login. **Forks consuming `LoginResponse` or `MeResponse` types must update their expectations** — both now carry roles + permissions. ([#322](https://github.com/ResetShop/angular-nx-standalone-starter/issues/322))
- **`.github/workflows/ci.yml` `test-integration` job** — switched `PG_TEST_CONNECTION_STRING` and `INTEGRATION_TEST_ADMIN_PASSWORD` from `secrets.*` to `vars.*` (GitHub Actions repository Variables, not Secrets). Neither value is sensitive — the workflow already declares an ephemeral `postgres:17` service container in the same job, so the connection string just points at `localhost:5432` and the admin password is a CI-only literal that exists only inside the ephemeral container. **Migration:** in repo Settings → Secrets and variables → Actions → **Variables** tab, add `PG_TEST_CONNECTION_STRING = postgresql://postgres:postgres@localhost:5432/test_db` and `INTEGRATION_TEST_ADMIN_PASSWORD = <any test-only password>`. The old `secrets.*` entries with the same names can be deleted afterwards. ([#319](https://github.com/ResetShop/angular-nx-standalone-starter/issues/319))

### Fixed

- **`@resetshop/generators:page` inner-directory casing** — the generator now produces fully kebab-case paths for compound names (e.g. `<dir>/order-history/order-history-list/order-history-list.ts`) instead of mixing kebab-case for the outer directory with camelCase for the inner `<%= name %>-list/` placeholder (which previously produced `<dir>/order-history/orderHistory-list/orderHistory-list.ts`). Single-word names (`product`, `order`) are unaffected. One-line change: `page/index.ts` now passes `name: n.fileName` to `generateFiles` instead of `name: n.propertyName`, matching the convention already used by the other generators. **Forks that have run `nx g @resetshop/generators:page <camelCaseName>` will need to rename the inner `*-list/` directory and its files from camelCase to kebab-case after this update.** ([#331](https://github.com/ResetShop/angular-nx-standalone-starter/issues/331))
- **`@resetshop/generators:drizzle-schema` filename casing** — the generator now writes files at `<directory>/<kebab-case>.ts` (e.g. `order-line-item.ts`) instead of `<camelCase>.ts` (e.g. `orderLineItem.ts`). Brings drizzle-schema in line with the `store`, `api-provider`, and `backend-module` generators (which already use `n.fileName` as the templateVar `name`) and matches the kebab-case file naming used everywhere else in `apps/reference-app/src/db/schema/`. Inside the generated file, JS identifiers and the table-name string stay camelCase (Drizzle's standard convention) — only the path on disk changes. **Forks that have run `nx g @resetshop/generators:drizzle-schema <camelCaseName>` and committed the resulting file will need to rename it to kebab-case after this update; single-word names (`product`, `order`) are unaffected.** Template variable cleanup: `__name__.ts.template` now uses `<%= propertyName %>` for the JS identifier and table-name string instead of the previously-overloaded `<%= name %>`. ([#330](https://github.com/ResetShop/angular-nx-standalone-starter/issues/330))
- **`package.json` `drizzle:seed` / `sync:permissions` scripts** — added `--tsconfig apps/reference-app/tsconfig.json` so tsx resolves the app-scoped `@contracts/*` / `@schema/*` path aliases. Running `npm run drizzle:seed` from the workspace root was failing with `ERR_MODULE_NOT_FOUND: Cannot find package '@contracts/user'` because tsx was resolving against `tsconfig.base.json`, where the app-scoped aliases are not declared.
- **`.github/workflows/ci.yml`** — fixed the broken bare-target form `npx nx test --skip-nx-cache` / `npx nx lint --skip-nx-cache` that was failing in modern Nx with `Cannot find configuration for task @app/source:test/lint`. Modern Nx looks for the target on the workspace root project (`@app/source`), which has no test/lint target — the workspace-wide invocation requires `npx nx run-many -t <target>`. Replaced both with `run-many` form. Also added a dedicated `typecheck` job (previously only run locally) and aligned the `e2e`/`build`/`storybook` jobs to the explicit `npx nx run reference-app:<target>:<config>` form for consistency. ([#319](https://github.com/ResetShop/angular-nx-standalone-starter/issues/319))
- **`package.json` `test:watch` / `test:ui` scripts** — converted from `nx test reference-app …` to the `nx run reference-app:test …` form used by the rest of the file (`storybook`, `storybook:build`, `test:e2e`). Behavior unchanged; aligns invocation style across all scripts. ([#319](https://github.com/ResetShop/angular-nx-standalone-starter/issues/319))
- **`.github/workflows/ci.yml`** — removed redundant `restore-keys: repo-${{ github.sha }}` from every cache step. The fallback was identical to the primary `key`, so a miss on the primary always missed the fallback too — the field added no coverage. Behavior unchanged. ([#319](https://github.com/ResetShop/angular-nx-standalone-starter/issues/319))
- **`apps/reference-app/playwright.config.ts`** — `webServer.command` was `nx run app:serve --port=3000`, referencing the legacy `app` project name that was removed in Epic 1 when `apps/reference-app` was created. Updated to `nx run reference-app:serve --port=3000`. Locally Playwright reuses an already-running dev server (`reuseExistingServer: !process.env.CI`) so the typo was hidden; on CI Playwright tries to spawn the server itself and Nx exits 1 because `app` doesn't exist. The `1.0.0-beta.3` sweep that fixed four other stale `nx run app:*` references in `ci.yml` missed this one. ([#319](https://github.com/ResetShop/angular-nx-standalone-starter/issues/319))
- **`.github/workflows/ci.yml`** — quoted `node-version: '22.20'` in all 9 occurrences (1 setup + 8 worker jobs). Unquoted, YAML parses `22.20` as the float `22.2`, so `actions/setup-node` was acquiring Node **22.2.0** on every CI run instead of 22.20.0. Node 22.2 predates the default-on `--experimental-require-module` (Node 22.12+), which is why `@angular/compiler-cli` and `@storybook/angular` were failing to load with `ERR_REQUIRE_ESM` in the `build` and `storybook` jobs. Quoting makes the version a string and forces the intended 22.20.x acquisition. ([#319](https://github.com/ResetShop/angular-nx-standalone-starter/issues/319))
- **`README.md` Project Setup Guide** — corrected 8 stale file references that still pointed at the pre-restructure single-app layout (`src/api/helpers/`, `src/app/`). Connector templates and environment config now correctly point at `packages/hono-core/src/lib/`; remaining app-specific paths now carry the `apps/reference-app/` prefix. A fork user following the optional integration instructions was previously hitting paths that no longer existed.
- **`packages/angular-core/src/lib/navigation/navigation-title.strategy.ts`** — translates `route.title` through `Translation.instant()` before writing to the document title. Previously the strategy passed the raw `route.title` value (an i18n key like `USERS.PAGE.TITLE`) straight to `Title.setTitle()`, so the browser tab read `USERS.PAGE.TITLE | <applicationName>` instead of `Users | <applicationName>`. Also added an `effect` that watches `Translation.currentLanguage` and re-applies the title when the active language changes between navigations (without it the tab title stayed frozen in whichever language was active at the last route change).
- **`apps/reference-app/src/contracts/auth/auth.schemas.ts`** — `meResponseSchema.email` was `z.string()` while `authUserSchema.email` was `z.email()`. Collapsing `meResponseSchema` into `authUserSchema` (see Changed entry above) tightens email validation on `/api/auth/me` to match `/api/auth/login`. ([#322](https://github.com/ResetShop/angular-nx-standalone-starter/issues/322))
- **Sidebar nav flicker during logout** — `provideAuth()` (`apps/reference-app/src/app/providers/auth/auth.provider.ts`) now accepts opt-in features in the `provideRouter`/`provideHttpClient` style. The new `withNavigationPermissionCheck()` feature wires the navigation library's `NAVIGATION_PERMISSION_CHECK` token through `AuthStore.currentUser`, and **returns `true` for any permission when no user is logged in**. The previous inline factory in `app.config.ts` re-evaluated `Navigation.sections` to a permission-stripped list the instant `authStore.logout()` cleared `currentUser`, producing a one-frame visible flicker before the route deactivated and the sidebar unmounted. Skipping the filter when no user is logged in eliminates the recomputation; route-level access is still enforced by `permissionGuard`, so this carries no security impact. **Migration for forks:** if your `app.config.ts` calls `provideAuth()` and you want the navigation permission check, change it to `provideAuth(withNavigationPermissionCheck())` and remove any inline `NAVIGATION_PERMISSION_CHECK` provider you may have copied. `provideAuth()` with no features is still valid and registers only the `AuthApi` token.

## [1.0.0-beta.3] — 2026-04-07

Final Epic 2 cleanup. Closes the milestone (`Monorepo restructure + fork distribution`).

### Changed

- **`.github/workflows/ci.yml`** — replaced four stale `nx run app:*` references (`stylelint`, `e2e`, `build:production`, `build-storybook`) with the current `nx run reference-app:*` invocations. The legacy `app` project name was removed when `apps/reference-app` was created in Epic 1; the CI workflow had not been updated alongside.
- **`.github/workflows/ci.yml`** — aligned all worker jobs to `node-version: 22.20` to match the `setup` job that builds the `node_modules` cache. Prior version mismatch (`22.12` on workers vs `22.20` on setup) was ABI-compatible but misleading.
- **`.github/workflows/upstream-guards.yml`** — removed redundant `&& github.event.pull_request != null` null checks from both job `if:` conditions. The `pull_request` event guarantees the field is non-null; the `github.repository ==` check alone is the meaningful gate.
- **`docs/forking.md`** — top-of-file status banner flipped from "target state with planned callouts" to "live as it exists today" now that Epic 2 is complete.

### Fixed

- **`apps/reference-app/project.json`** `serve-static` target — `staticFilePath` was `"dist/app/browser"` (the old single-app output dir). Build's `outputPath` is `"dist/reference-app"`, so the correct serve path is `"dist/reference-app/browser"`. The target had been silently serving from a non-existent directory.
- **`apps/reference-app/src/api/utils/password.ts`** comment — said `"copied to dist/app/server/wordlists/"`. Updated to `dist/reference-app/server/wordlists/`. Runtime was unaffected (the code uses `import.meta.dirname`), but the comment misled developers debugging wordlist loading.

## [1.0.0-beta.2] — 2026-04-07

Adds the upstream CI guard layer that protects the starter contract on incoming PRs.

### Added

- **`.github/workflows/upstream-guards.yml`** — single workflow with two jobs:
  - **`boundary-guard`** — fails if a PR touches any path under `apps/` other than `apps/reference-app` or its subdirectories. Sibling-named directories (e.g. `apps/reference-app-staging/`) are deliberately treated as offending. Bypass label: `allow-app-change`.
  - **`changelog-guard`** — fails if a PR modifies starter-owned code (anything under `packages/`, `apps/reference-app/`, `scripts/`, `docs/`, `drizzle/`, `e2e/`, `.github/`, `.claude/`, plus the root config files) without adding an entry to `CHANGELOG.md`. Bypass label: `skip-changelog`. `CHANGELOG.md` itself is intentionally excluded from the trigger to avoid a circular requirement.
  - Both jobs are gated to `github.repository == 'ResetShop/angular-nx-standalone-starter'` so they never fire on forks. Both re-evaluate when bypass labels are added or removed via `pull_request: types: [opened, synchronize, reopened, labeled, unlabeled]`.
- **`.github/pull_request_template.md`** — Fork-distribution checklist (CHANGELOG entry, no fork-owned paths touched, CI guards reviewed). Top comment notes the template applies to PRs against the upstream repo only; forks may delete or replace it.

### Changed

- **`docs/forking.md`** — §9 (CI guards) converted from planned to active tense; §5 (conflict resolution) forward reference to PR 2.4 resolved.

## [1.0.0-beta.1] — 2026-04-07

Adds the starter/app boundary enforcement layer on top of the structural restructure shipped in `1.0.0-beta.0`.

### Added

- **Nx tag scheme `scope:starter` / `scope:app`** — all upstream-owned projects (`packages/*` and `apps/reference-app`) carry `scope:starter`; fork-generated apps emit `scope:app` from the schematic. The schematic's tag rewrite now actually fires against the renamed workspace.
- **ESLint `@nx/enforce-module-boundaries` `depConstraints` for `scope:*`** — `scope:starter` projects may only depend on other `scope:starter` projects; `scope:app` projects may depend on both `scope:starter` and `scope:app`. Stacks with the existing `type:*` constraints.
- **ESLint cross-boundary relative-import bans** — two new flat-config blocks (`no-cross-boundary-relative-imports-from-packages` and `no-cross-boundary-relative-imports-from-apps`) using depth-agnostic `^(\.\./)+(apps|packages)/` regex patterns. Forces consumers to use the `@<scope>/*` package aliases instead of relative paths across the boundary.

### Changed

- **`nx.json` `defaultBase` changed from `master` to `main`** — matches the actual upstream branch name; fixes silent breakage of `nx affected` and Nx Cloud CIPE diffs. **Fork action:** if your fork's primary branch is not `main`, change `defaultBase` once to match your branch name after merging this version.

### Removed

- **`nx.json` `defaultProject`** — relied on by direct `nx` CLI calls which are forbidden by CLAUDE.md's command policy. Removing it eliminates a fork-merge conflict surface and forces explicit project naming in every command.

## [1.0.0-beta.0] — 2026-04-06

This is the first tagged version of the starter under the fork-distribution model. Forks created after this version should track the changelog entries above as the canonical record of what has changed since their initial fork point.

### Added

- **Fork-distribution model.** The repository is now designed to be forked rather than consumed as a published package set. Starter code lives in `packages/*` and `apps/reference-app`; fork apps live in `apps/<your-app>`.
- **`@resetshop/generators:app` schematic** — clones `apps/reference-app` into `apps/<slug>` for new app creation. Invoked via `npm run generate:app -- --name="My App"`. Includes 20 unit tests and a smoke-test pass against the live workspace.
- **`docs/forking.md`** — full forking workflow documentation: ownership boundaries, initial setup, app creation, upstream merge process with conflict resolution conventions, the changelog contract, and what NOT to do.
- **README forking section** — quickstart snippet pointing at `docs/forking.md`.
- **`packages/hono-core` exports `isServerless()`** — moved from a per-app helper file in `apps/reference-app/src/api/utils/environment.ts` so backend modules across multiple apps can share the same runtime check.
- **Uniform CI target set** — every project under `packages/*` and `apps/*` now exposes the targets it legitimately needs (`build`, `test`, `typecheck`, `lint`, `stylelint`, `build-storybook` where applicable).
- **`CLAUDE.md` Canonical App Creation Workflow section** — explicit policy that new apps must always be created via the schematic; direct hand-copying of `apps/reference-app` is forbidden.
- **Coding agent collaboration policy** — `.claude/references/coding-agent-policies.md` codifies the rule against shortcut framings on solo-maintainer assumptions, plus other anti-patterns. Referenced from `CLAUDE.md` as a hard constraint.

### Changed

- **Monorepo restructured** under `packages/*` and `apps/reference-app/src/`. UI components live in `@resetshop/ui`, Angular providers in `@resetshop/angular-core`, Hono backend infrastructure in `@resetshop/hono-core`, framework-free utilities in `@resetshop/util`, and Nx generators in `@resetshop/generators`. All app-specific code (stores, providers, API modules, drizzle schemas, contracts) lives under `apps/reference-app/src/`.
- **Tailwind config moved to workspace root.** `tailwind.config.css` now lives at the workspace root and globs into both `apps/*` and `packages/*` via `@source` directives, so all projects pick up the same theme.
- **Backend imports migrated from relative `'../../openapi-app'` to `@resetshop/hono-core`** across the reference app's API controllers and repositories. Forks consuming the reference template see no behavioural change but should use the package alias for any new backend code.
- **`package.json` `dependencies` and `devDependencies` strictly alphabetized** — minimizes conflict surface for forks adding their own dependencies.

### Removed

- **Single-app starter layout.** The original root-level `src/`, `project.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `playwright.config.ts`, `vitest.config.ts`, `vitest.integration.config.ts`, and `tools/` directories have been removed. Their content lives under `apps/reference-app/` or `packages/*/eslint/` now. **Fork action:** any fork-local imports via the old root-relative paths must be updated to use `apps/reference-app/...` paths or `@resetshop/*` aliases.
- **`apps/reference-app/src/api/openapi-app.ts`** and **`apps/reference-app/src/api/utils/environment.ts`** — replaced by `@resetshop/hono-core` exports.

### Notes — deferred work tracked in GitHub Issues

- **`hono-core` environment.ts split** — `isServerless()` currently sits next to an app-specific `environment` constant with a pre-existing type unsoundness. To be split. ([#258](https://github.com/ResetShop/angular-nx-standalone-starter/issues/258))
- **Hardcoded millisecond constants sweep** — codebase-wide migration to the duration-string utilities. ([#259](https://github.com/ResetShop/angular-nx-standalone-starter/issues/259))
- **Pluggable starter scope options** — the `app` schematic currently only supports a full clone of `reference-app`. A future iteration will add `--starter` presets. ([#260](https://github.com/ResetShop/angular-nx-standalone-starter/issues/260))
- **`apps/reference-app` e2e test coverage** — Playwright config exists but no specs. ([#261](https://github.com/ResetShop/angular-nx-standalone-starter/issues/261))

<!--
  Link references below resolve once the corresponding git tags are pushed
  upstream. Until then they 404; do not click them blindly. They are kept
  here so the markdown anchor format is established for future versions.
-->

[Unreleased]: https://github.com/ResetShop/angular-nx-standalone-starter/compare/v1.0.0-beta.3...HEAD
[1.0.0-beta.3]: https://github.com/ResetShop/angular-nx-standalone-starter/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/ResetShop/angular-nx-standalone-starter/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/ResetShop/angular-nx-standalone-starter/compare/v1.0.0-beta.0...v1.0.0-beta.1
[1.0.0-beta.0]: https://github.com/ResetShop/angular-nx-standalone-starter/releases/tag/v1.0.0-beta.0
