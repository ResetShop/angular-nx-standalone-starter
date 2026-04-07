# Changelog

All notable changes to this starter are documented here. Forks should read this file before every upstream merge — it is the single source of truth for what changed upstream and whether any of those changes affect fork-owned code or require migration work.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). Versioning cadence: **every fork-visible breaking change cuts a new version**; non-breaking changes accumulate under `## [Unreleased]` until the next breaking change forces a new release. A "fork-visible breaking change" is anything that requires a fork to take action during a merge — removed files, renamed APIs, changed schemas, restructured directories, or modified contracts. Pre-1.0 versions use the `1.0.0-beta.N` numbering convention while the fork-distribution model is being stabilized.

## [Unreleased]

### Planned for the next release

- **Upstream CI guards** — `boundary-guard` and `changelog-guard` workflows + PR template (Epic 2 PR 2.4, #293)
- **Holistic cross-cutting cleanup** (Epic 2 PR 2.5, #294)

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
  Link references below resolve once the v1.0.0-beta.0 git tag is pushed
  upstream. Until then they 404; do not click them blindly. They are kept
  here so the markdown anchor format is established for future versions.
-->

[Unreleased]: https://github.com/ResetShop/angular-nx-standalone-starter/compare/v1.0.0-beta.0...HEAD
[1.0.0-beta.0]: https://github.com/ResetShop/angular-nx-standalone-starter/releases/tag/v1.0.0-beta.0
