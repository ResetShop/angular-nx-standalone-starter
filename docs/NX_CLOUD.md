# Nx Cloud Remote Caching & Distributed Task Execution

This document is the setup runbook for **Nx Cloud remote caching** in this workspace, the evaluation of **distributed task execution (DTE)**, and the required token / network-policy configuration. It is the agent-and-performance slice of epic [#403](https://github.com/ResetShop/angular-nx-standalone-starter/issues/403) (issue [#406](https://github.com/ResetShop/angular-nx-standalone-starter/issues/406)).

> **TL;DR:** Remote caching is **wired but not yet active**. `nx.json` already carries an `nxCloudId`, but the Nx Cloud workspace was never claimed and now returns `401`. To turn remote caching on, the repo owner must (1) claim the workspace and (2) provision an `NX_CLOUD_ACCESS_TOKEN`. Until then, Nx silently falls back to the **local** cache (which works) — nothing is broken.

---

## Why remote caching matters here

Claude Code web sessions and CI runners are **ephemeral**: each starts from a fresh clone and is reclaimed after the run. A purely local Nx cache (see [#404](https://github.com/ResetShop/angular-nx-standalone-starter/issues/404)) is discarded when the container is reclaimed, so the first run in every new container/session is always cold.

A **remote** cache restores task outputs **across** containers, sessions, and CI runs: once any machine has built a task with a given input hash, every other machine — local dev, the next web session, and CI — can download the output instead of recomputing it. This is what makes the `ci:verify` script (#404) pay off beyond a single machine.

---

## Current state (as verified)

| Fact                             | Value / Evidence                                                                                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nxCloudId` set                  | `68ee91eecec0875b0f57a8d2` (in `nx.json`)                                                                                                                                                                             |
| Workspace claimed?               | **No.** Nx returns `401`: _"This workspace is more than three days old and is not connected. Workspaces must be connected within 3 days of creation. Claim your workspace at https://cloud.nx.app."_                  |
| `NX_CLOUD_ACCESS_TOKEN` present? | **No** — not in the environment, not in `.env`.                                                                                                                                                                       |
| Local cache working?             | **Yes** — `ci:verify` restored 8/12 tasks from the local cache on a warm tree; an isolated `stylelint` run restored 1/1.                                                                                              |
| Remote cache hits demonstrable?  | **Not in this environment.** Requires the owner to claim the workspace and set a token (see below). This is the one acceptance-criterion of #406 that cannot be satisfied without owner-only Nx Cloud account access. |

Because `--skip-nx-cache` is passed on every `nx` invocation in `.github/workflows/ci.yml` (and on the cold `npm run ci`), the cache — local **and** remote — is currently bypassed in CI regardless. #404 already removed `--skip-nx-cache` from the local `ci:verify` path; the CI edits below complete the picture once the workspace is claimed.

---

## Enablement runbook (owner actions)

### 1. Claim the Nx Cloud workspace

Open the connect-workspace guide (generated from the current `nxCloudId`):

```
https://nx.app/setup/connect-workspace/guide?nxCloudId=68ee91eecec0875b0f57a8d2&vcsProvider=github
```

Sign in with the GitHub account that owns `ResetShop/angular-nx-standalone-starter` and follow the prompts to connect the repository. If the workspace has fully expired, create a fresh one with `npx nx connect` — Nx prints the new workspace ID at the end of that flow; copy it and update `nxCloudId` in `nx.json` **manually** (the connect flow does not reliably patch the file across Nx versions).

### 2. Provision an access token

In the Nx Cloud dashboard for the workspace, create a **CI access token** (read-write) and a **read-only** token for less-trusted contexts.

- **GitHub Actions:** add the read-write token as a repository **secret** named `NX_CLOUD_ACCESS_TOKEN` (Settings → Secrets and variables → Actions → Secrets). Do **not** use a repo Variable — the token is sensitive.
- **Local development / web sessions:** export `NX_CLOUD_ACCESS_TOKEN` in the shell or `.env`. A read-only token is appropriate for local dev if you want CI to be the only cache writer.

### 3. Network policy (egress)

Remote caching requires outbound HTTPS to Nx Cloud. Allow egress to:

- `api.nx.app` — the cache read/write API endpoint (the host that actually matters for caching).
- `cloud.nx.app` — the dashboard / browser claim flow (step 1).
- _Conservative blanket alternative:_ if your egress policy is host-coarse, allowing `*.nx.app` covers both, but prefer the two specific hosts above.

In sandboxed/web environments with a restrictive egress policy, these must be explicitly permitted or every cache read/write will time out and fall back to local.

### 4. Apply the CI workflow edits (after step 1–3)

Once the workspace is claimed and `NX_CLOUD_ACCESS_TOKEN` exists, update `.github/workflows/ci.yml` so CI can read/write the remote cache. **Do not apply these before claiming** — until then they only add failing cloud round-trips and "complete setup" nags.

Add the token at the top level so every job inherits it:

```yaml
# `env:` is a TOP-LEVEL key — same indentation as `on:` and `jobs:`, NOT nested under `on:`.
on:
  pull_request:

env:
  NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}

jobs:
  # …existing jobs unchanged…
```

Then drop `--skip-nx-cache` from **every cacheable job** so they consult the cache. There are **six**: `test` (line 61), `typecheck` (line 79), `lint` (line 97), `stylelint` (line 115), `build` (line 207), and `storybook` (line 225). The two diffs below are representative — apply the same `--skip-nx-cache` removal to all six:

```diff
-        run: npx nx run-many -t test --skip-nx-cache
+        run: npx nx run-many -t test
```

```diff
-        run: npx nx run reference-app:build:production --skip-nx-cache
+        run: npx nx run reference-app:build:production
```

Keep the `e2e` job (line 179) cold (`--skip-nx-cache`) for now — it is the most environment-sensitive (browser install) and the lowest-value cache target. The `test-integration` job runs via `npm run test:integration` (line 147) and carries **no** `--skip-nx-cache` flag to remove — it is already cache-neutral at the workflow level; leave it as-is.

> The cold `npm run ci` script (the local authoritative final gate from #404) intentionally keeps `--skip-nx-cache` and is **not** changed by this — a cold run must always prove correctness independent of any cache.

---

## Distributed Task Execution (DTE / Nx Agents) — evaluation

| Lever                                                  | Verdict for this workspace | Rationale                                                                                                                                                                                                                                   |
| ------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Remote cache**                                       | **Adopt** (after claim)    | Biggest cross-container win; restores outputs across CI, local, and web sessions.                                                                                                                                                           |
| **`nx affected` on PR CI**                             | **Adopt** (follow-up)      | The workspace has ~8 projects; PRs rarely touch all of them. Replacing `nx run-many` with `nx affected` skips unaffected projects. Best paired with remote caching.                                                                         |
| **DTE / Nx Agents** (distribute tasks across machines) | **Defer**                  | Overkill at current size — the full cold `ci` is ≈46–52s across 8 projects. DTE earns its complexity when total task time is in the many-minutes range or the project count grows materially. Revisit when build time becomes a bottleneck. |

A concrete `nx affected` adoption (changing the `run-many` jobs to `affected -t <target> --base=origin/main`) is a sensible next issue once remote caching is live; it is intentionally **not** bundled here to keep this change owner-actionable and reversible.

---

## Verification status (issue #406 acceptance criteria)

- [x] **Token + network-policy setup documented** — this file.
- [x] **`--skip-nx-cache` masking identified** — present on every CI job and the cold `npm run ci`; the post-claim edits and #404's `ci:verify` remove it from the cacheable paths.
- [ ] **Remote cache hits demonstrably restore tasks across a fresh container/session** — **blocked**: the Nx Cloud workspace is unclaimed (`401`) and no token exists in any reachable environment. Live verification was attempted and the blocker is documented above with evidence. This box can be checked once steps 1–3 are completed by the repo owner.
