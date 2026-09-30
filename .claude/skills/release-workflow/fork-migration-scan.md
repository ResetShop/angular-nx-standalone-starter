# Fork migration scan

Procedure for [`/release-workflow`](SKILL.md) Phase 1 step 6. It works out, at release time, **which changes in the release window require a fork to act, and what the fork must do**. The result is the release section's `### Fork migration` checklist.

Pull requests do not write CHANGELOG entries, so nobody records these actions while the milestone is in progress. This scan is where they are found. It reads what each merged pull request says **and** what its diff changed on the surfaces a fork depends on. A pull request description is a lead, never a substitute for reading the diff.

## Why forks need this

Forks merge `upstream/main` into their own repository (`npm run upstream:pull`). What reaches them depends on the path, per the ownership table in [`docs/forking.md`](../../../docs/forking.md) §2:

- **`packages/*`, root config, `scripts/`, `drizzle/`, `.github/workflows/`, `e2e/`** arrive in the fork on merge. A breaking change here breaks the fork's build, tests or runtime directly.
- **`apps/reference-app`** also arrives, but a fork's own app (`apps/<your-app>`) is a **copy** made when the fork generated it. Changes to the reference app reach a fork's app only through code the fork copied or reuses. They belong in the "if your fork changed or reuses" group, never in "every fork".

## Inputs

- `P` — the previous release tag: `git tag --list 'v*' --sort=-v:refname | head -n 1`. Not `git describe` from `develop`: release tags sit on `main`'s release merge commits, outside `develop`'s history, so `git describe` returns an older tag.
- `END` — `origin/develop` for a release. To re-run the scan over a **past** release window, use the `develop` state that release shipped:
  - from v1.0.2 onward the tag is on `main`'s release merge, so use its second parent, `<tag>^2`;
  - v1.0.0 and v1.0.1 were tagged directly on `develop` commits, so use the tag itself.

## Steps

1. **List the pull requests merged in the window.**

   ```bash
   git log --first-parent --format='%H %s' P..END
   ```

   Take the pull request number from `Merge pull request #N from …` subjects, or from a trailing `(#N)` on squash merges. Skip the release-prep pull request and Dependabot pull requests that only bump patch or minor versions.

2. **For each pull request, read its description and its exact file list.**

   ```bash
   gh pr view N --json number,title,body,closingIssuesReferences,milestone
   git diff --name-status -M <merge-sha>^1 <merge-sha>
   ```

   Use `git diff` for the file list, not `gh pr view --json files`, which stops at 100 files. The pull request's closing issues are the issues a checklist line cites.

3. **Inspect every surface below that the file list touches**, with `git diff <merge-sha>^1 <merge-sha> -- <path>`:

   | Surface                  | Paths                                                                                                                                                                                        | Fork action when…                                                                                                                    | Group                                                     |
   | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
   | Removed or renamed code  | Status `D` or `R` under `packages/`, `apps/reference-app/src/`, `scripts/`, `e2e/`; removed `export` lines in `packages/**/*.ts`                                                             | A file, export, function, component or path-alias import a fork may use disappears or moves                                          | If you changed or reuse                                   |
   | Translation keys         | `packages/angular-core/src/lib/i18n/translations.schema.ts`, `apps/reference-app/src/app/providers/i18n/translations/{en,es}.ts`                                                             | A key is added, removed or renamed in `TranslationSchema`. Forks with their own language files fail the type-check until they match. | Language files                                            |
   | API contracts            | `apps/reference-app/src/contracts/**`, `src/api/**/*.routes.ts`, `docs/api/**/*.bru`, service and API interfaces                                                                             | A request or response shape, status code or interface a fork implements or mocks changes                                             | If you changed or reuse, or no action (status codes only) |
   | Database and environment | `drizzle/**`, `apps/reference-app/src/db/schema/**`, `src/api/config/*.env.ts`                                                                                                               | A migration must run, or a new required environment variable appears                                                                 | Every fork                                                |
   | Toolchain                | `package.json` (`engines`, `packageManager`, `allowScripts`, major versions of Angular, Nx, TypeScript, `@ngrx/*`, Prettier), `.nvmrc`, `tsconfig.base.json`, `nx.json`, `eslint.config.mjs` | The Node version, a core major version, a compiler or lint rule, or the install procedure changes                                    | Every fork                                                |
   | Generators               | `packages/generators/**`, the `GENERATORS` list in `scripts/check-generators-load-as-esm.mjs`                                                                                                | Generator rules or templates change, affecting forks that add their own generators                                                   | If you changed or reuse                                   |
   | Routes and providers     | `apps/reference-app/src/app/**/*.routes.ts`, `app.routes.ts`, `app.config.ts`, `provide*` functions, route `providers` arrays                                                                | Route structure or provider registration changes                                                                                     | If you changed or reuse                                   |
   | Runtime behaviour        | Any of the above, or the pull request description                                                                                                                                            | Behaviour changes (sessions, authentication, status codes) with nothing for the fork to edit                                         | No action needed                                          |

4. **Write one line per action**, in the group given by the table, and merge duplicates across pull requests into one line citing every issue involved.

   ```markdown
   - [#N] - <What the fork must do, as an instruction>.
   - [#A], [#B] - <One action caused by two changes>.
   ```

   State the action, not the change: "Use Node.js 24.20.0 or later", not "Node.js was upgraded".

5. **Record the evidence** for every line in a table in `workspace/RELEASE.md`:

   | Issue | Pull request | Path(s) | What changed | Group and action |
   | ----- | ------------ | ------- | ------------ | ---------------- |

   When the diff shows a fork-visible change but the action cannot be stated from it, keep the row and mark the action **`NEEDS MAINTAINER INPUT`**. The Pre-flight pause resolves it.

## Output

The checklist groups, in this order, each introduced by a sentence and listed only when it has at least one line:

1. **Every fork:**
2. **If your fork ships its own language files** (the `TranslationSchema` type-check lists every missing or unknown key):
3. **If your fork changed or reuses any of the following:**
4. **Behaviour that changes with no action needed:**

The v1.1.0 section of `CHANGELOG.md` is the reference for tone and granularity.

**When the scan finds nothing**, the release section has **no `### Fork migration` heading**, and its opening paragraph says "No fork action is needed." `upstream:pull` pauses a fork's merge whenever the new CHANGELOG text contains "migration" or "breaking" (`detectChangelogWarnings` in `scripts/lib/upstream-pull.helpers.mjs`). An empty `### Fork migration` heading in every release would make that pause fire every time, and forks would learn to skip it.

## Not fork actions

- Refactors that change no exported name, file path, contract or behaviour.
- Changes to tests, stories or documentation only.
- Changes to upstream-only workflows gated on `github.repository == 'ResetShop/angular-nx-standalone-starter'`.
- Dependency patch and minor updates, unless they change `engines` or require a reinstall.
