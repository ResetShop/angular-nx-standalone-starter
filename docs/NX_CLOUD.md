# Nx Cloud Remote Caching & Distributed Task Execution

This document is the setup runbook for **Nx Cloud remote caching** in this workspace, the evaluation of **distributed task execution (DTE)**, and the required token / network-policy configuration. It is the agent-and-performance slice of epic [#403](https://github.com/ResetShop/angular-nx-standalone-starter/issues/403) (issue [#406](https://github.com/ResetShop/angular-nx-standalone-starter/issues/406)).

> **TL;DR:** Remote caching is **active**. The Nx Cloud workspace (`nxCloudId` `6a17a0e34cc7a0ffaeec195e` in `nx.json`) is claimed, the `NX_CLOUD_ACCESS_TOKEN` is provisioned (GitHub Actions secret + local `.env`), and `.github/workflows/ci.yml` reads/writes the remote cache on its cacheable jobs (`e2e` stays cold by design). The first CI run after activation is still cold (it populates the remote cache); warm/subsequent runs and other containers restore from it.

---

## Why remote caching matters here

Claude Code web sessions and CI runners are **ephemeral**: each starts from a fresh clone and is reclaimed after the run. A purely local Nx cache (see [#404](https://github.com/ResetShop/angular-nx-standalone-starter/issues/404)) is discarded when the container is reclaimed, so the first run in every new container/session is always cold.

A **remote** cache restores task outputs **across** containers, sessions, and CI runs: once any machine has built a task with a given input hash, every other machine — local dev, the next web session, and CI — can download the output instead of recomputing it. This is what makes the `ci:verify` script (#404) pay off beyond a single machine.

---

## Current state (as verified)

| Fact                             | Value / Evidence                                                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nxCloudId` set                  | `6a17a0e34cc7a0ffaeec195e` (in `nx.json`, set by the workspace-claim PR #421)                                                                                                               |
| Workspace claimed?               | **Yes** — connected via Nx Cloud; the previous `68ee…` workspace had expired (`401`) and was replaced.                                                                                      |
| `NX_CLOUD_ACCESS_TOKEN` present? | **Yes** — a GitHub Actions repository secret (consumed by `.github/workflows/ci.yml`) and a local `.env` entry for dev/agent runs.                                                          |
| CI reads/writes the remote cache | **Yes** — `--skip-nx-cache` removed from the six cacheable jobs (`test`, `typecheck`, `lint`, `stylelint`, `build`, `storybook`); token inherited via a top-level `env:`. `e2e` stays cold. |
| Local cache working?             | **Yes** — `ci:verify` restores tasks from the local cache on a warm tree; the cold `npm run ci` deliberately bypasses both caches.                                                          |

The local `ci:verify` path (#404) and the CI cacheable jobs no longer pass `--skip-nx-cache`, so both consult the Nx Cloud remote cache. The cold `npm run ci` and the CI `e2e` job intentionally keep `--skip-nx-cache`.

---

## Enablement runbook (owner actions) — **completed**

> This runbook records how remote caching was turned on (PR #421 claimed the workspace; the CI edits landed here). It is retained as the reproduction/recovery procedure if the workspace ever needs re-claiming or a fork needs to wire its own.

### 1. Claim the Nx Cloud workspace — done (`nxCloudId` `6a17a0e34cc7a0ffaeec195e`)

Open the connect-workspace guide (generated from the current `nxCloudId`):

```
https://nx.app/setup/connect-workspace/guide?nxCloudId=6a17a0e34cc7a0ffaeec195e&vcsProvider=github
```

Sign in with the GitHub account that owns `ResetShop/angular-nx-standalone-starter` and follow the prompts to connect the repository. If the workspace ever expires, create a fresh one with `npx nx connect` — Nx prints the new workspace ID at the end of that flow; copy it and update `nxCloudId` in `nx.json` **manually** (the connect flow does not reliably patch the file across Nx versions).

### 2. Provision an access token

In the Nx Cloud dashboard for the workspace, create a **CI access token** (read-write) and a **read-only** token for less-trusted contexts.

- **GitHub Actions:** add the read-write token as a repository **secret** named `NX_CLOUD_ACCESS_TOKEN` (Settings → Secrets and variables → Actions → Secrets). Do **not** use a repo Variable — the token is sensitive.
- **Local development / web sessions:** export `NX_CLOUD_ACCESS_TOKEN` in the shell or `.env`. A read-only token is appropriate for local dev if you want CI to be the only cache writer.

> **Use the token exactly as the dashboard gives it.** Current Nx Cloud tokens are an opaque, base64-style string (they may end in `=`); paste the value **verbatim — do not base64-encode or decode it**. Two failure modes to know: a **missing** token makes Nx fall back to the local cache (no error), but a **present-but-invalid/mismatched** token is **fatal** — Nx returns `401 "a workspace could not be found with the provided CI Access Token"` and the task **exits non-zero**, failing the CI job. So a wrong token does not silently degrade; it breaks CI until corrected.

### 3. Network policy (egress)

Remote caching requires outbound HTTPS to Nx Cloud. Allow egress to:

- `api.nx.app` — the cache read/write API endpoint (the host that actually matters for caching).
- `cloud.nx.app` — the dashboard / browser claim flow (step 1).
- _Conservative blanket alternative:_ if your egress policy is host-coarse, allowing `*.nx.app` covers both, but prefer the two specific hosts above.

In sandboxed/web environments with a restrictive egress policy, these must be explicitly permitted or every cache read/write will time out and fall back to local.

### 4. Apply the CI workflow edits (after step 1–3) — done

`.github/workflows/ci.yml` now reads/writes the remote cache. These edits were applied **after** the workspace was claimed and the token provisioned (applying them earlier would only add failing cloud round-trips and "complete setup" nags). For the record, the edits were:

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
- [x] **`--skip-nx-cache` masking removed from the cacheable paths** — gone from #404's `ci:verify` and from the six cacheable CI jobs; the cold `npm run ci` and the CI `e2e` job keep it by design.
- [x] **Remote caching activated** — workspace claimed (PR #421), `NX_CLOUD_ACCESS_TOKEN` provisioned (GitHub Actions secret + local `.env`), CI wired.
- [x] **Remote cache hits demonstrably restore tasks across a fresh container/session** — verified on PR #417's CI: all six cacheable jobs run green with Nx Cloud engaged (no `401`); the run recorded a CIPE at `https://cloud.nx.app/cipes/6a17bf4a8c10aa6339279441`. The first run after activation populates the remote cache (cold); subsequent fresh runners restore the cacheable tasks from it. The cold `npm run ci` and the CI `e2e` job stay full-cold by design.
