# Evaluation: `/thermo-nuclear-code-quality-review` vs. our `code-reviewer` agent

**Issue:** [#409](https://github.com/ResetShop/angular-nx-standalone-starter/issues/409) (agent/performance slice of [#378](https://github.com/ResetShop/angular-nx-standalone-starter/issues/378)) · **Date:** 2026-05-27

## Recommendation — **AUGMENT** (do not replace, do not reject)

Wire the thermo-nuclear prompt in as an **optional, pre-review structural pass that stays gated behind our `code-reviewer` agent** — and only after amending it to load `CLAUDE.md` + `.claude/references/` first. It is a strong _idea generator_ for structural simplification, but it is **context-blind** and must never be the last line of defense. It does **not** replace `code-reviewer` and does **not** justify slimming our references.

A follow-up implementation issue is filed (see bottom).

---

## 1. What the skill actually is

- **Source:** `cursor/plugins` → `cursor-team-kit/skills/thermo-nuclear-code-quality-review/`.
- **Contents:** a single `SKILL.md` (plus an `agents/…md` variant). **It is prompt-only — no scripts, no executable code, no commands.** "Running" it means applying its review prompt via the model; the skill itself executes nothing.
- **Supply-chain surface:** effectively nil from the skill body (it is Markdown). The only code executed is the installer CLI, `vercel-labs/skills` (`npx skills add …`), a reputable open tool. Reviewing the SKILL.md before running (done here) is sufficient diligence.
- **Frontmatter:** `disable-model-invocation: true` — it never auto-triggers; it is invoked explicitly.

### Install mechanism (verified working)

```
npx -y skills add https://github.com/cursor/plugins --skill thermo-nuclear-code-quality-review
```

Installs to a **global** agents dir (`~/AppData/Local/.agents/skills/…` on Windows, symlinked into Claude Code) — it does **not** add files to the project repo, so adoption would be an explicit, separate decision (e.g. cloning it into `.claude/skills/` via `scripts/setup-skills.mjs`, the repo's existing skill-distribution mechanism).

## 2. Methodology

Installed the skill, then applied its prompt verbatim to two representative, non-trivial real files spanning two layers:

- `apps/reference-app/src/app/store/users/users.store.ts` (357 lines — NgRx signal store)
- `apps/reference-app/src/api/modules/user/user-management.repository.ts` (447 lines — Drizzle repository)

Raw findings: `workspace/thermo-nuclear-sample-run.md`.

## 3. Character of its output

- **Harsh but structural, not nit-spraying.** The "be ambitious / code judo" framing biases toward a few high-value findings over a long style tail. ~2 genuinely valuable findings per file.
- **Actionable.** Every top finding named a concrete extraction target / helper / location, and translated "delete a layer" into real deletions:
  - the 5 near-identical mutation `rxMethod` skeletons in `users.store.ts` (~130/357 lines) → a `runMutation(...)` factory;
  - `patchReadError`/`patchMutationError` duplicated verbatim across the users/roles/permissions stores → one generic helper;
  - the 11-column user projection literal repeated 4× in the repository → one shared `userColumns` const;
  - the redundant pre-`SELECT` before each guarded `UPDATE … RETURNING` (`RETURNING` already reports the match) → drop the round-trip.
  - These are exactly the structural-DRY / dead-orchestration issues routine line-by-line review misses.
- **False positives against THIS repo: present and non-trivial (~30–40% of lower-severity output).** Because it is context-blind, an operator must suppress:
  - merging the two `withMethods` blocks / de-duplicating `inject()` calls — the two-block split is **mandated** by CLAUDE.md's store structure;
  - guarding Drizzle guaranteed-single-row array access — "magic over boring", contradicts its own rule 4;
  - and, on less-compliant code, generic advice it _would_ emit that violates our hard constraints: `async/await` over the mandated `rxMethod`, renaming `find*()` repo getters, `Object.freeze()`-vs-enum, file-local `Projection` types. It only stayed clean here because these files already comply.

## 4. Coverage vs. our `code-reviewer` agent

| Dimension                                                                                                                                                                                              | `code-reviewer` (ours)                                         | thermo-nuclear skill                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Project hard constraints (≤50-line fn, ≤500-line file, no barrels, duration strings, `rxMethod`, `find*()`/`get*()` naming, `Projection` types, `Object.freeze()`, Storybook + integration-test gates) | **Yes** — explicit checklist tied to CLAUDE.md + 12 references | **No** — only a generic ~1000-line file smell; unaware of every project-specific rule |
| Structural/abstraction "code judo" (delete layers, collapse duplicated skeletons, remove redundant orchestration)                                                                                      | Partial (SOLID/CUPID lens, but less aggressive)                | **Yes — its core strength**                                                           |
| SOLID / CUPID                                                                                                                                                                                          | Yes (dedicated references)                                     | Implicitly, via maintainability lens                                                  |
| Security (OWASP, secrets, injection, authz)                                                                                                                                                            | Yes (+ `security-auditor`)                                     | No                                                                                    |
| Test-coverage / Storybook / integration-test gates                                                                                                                                                     | Yes (blocking)                                                 | No                                                                                    |
| Docs-currency / Bruno / CHANGELOG gates                                                                                                                                                                | Yes                                                            | No                                                                                    |
| CI verification (`ci:verify`)                                                                                                                                                                          | Yes — runs it                                                  | No                                                                                    |
| False-positive rate on this repo                                                                                                                                                                       | Low (context-rich)                                             | Moderate (context-blind)                                                              |
| Runtime                                                                                                                                                                                                | Heavier (loads 12 refs + runs CI)                              | Lighter (prompt only)                                                                 |

**Overlap with `.claude/references/*`:** minimal. The skill encodes a generic maintainability philosophy that loosely overlaps `solid`/`cupid`/`guiding-principles`, but it knows **none** of our project-specific references (`backend-api`, `domain-model`, `auth`, `generators`, `accessibility`, `coding-agent-policies`, the testing conventions). It cannot replace any reference, and adopting it is **not** a reason to slim our reference set (relevant to #407/#410, which keep the full set for `code-reviewer`).

## 5. Decision rationale

- **Not REPLACE:** it lacks every project-specific hard-constraint check, all security/test/docs gates, and CI verification; its moderate false-positive rate against our conventions makes it unsafe as the last line of defense. Replacing `code-reviewer` would be a clear regression in review thoroughness (the epic's explicit non-goal).
- **Not REJECT:** it reliably surfaces ambitious structural simplifications (duplicated skeletons, redundant orchestration, repeated literals) that our line-oriented checklist under-weights. That is real, repeatable value.
- **AUGMENT:** run it as an **optional pre-review structural pass** _before_ `code-reviewer`, **gated** so its findings are filtered by the context-rich reviewer (and a human) rather than applied blindly. To make it safe standalone, amend the invocation to load `CLAUDE.md` + `.claude/references/` first so it stops contradicting mandated conventions.

## 6. Follow-up

Per #409's decision gate (augment ⇒ file an implementation issue), a follow-up issue tracks wiring the skill in as a gated, references-aware pre-review pass and deciding its distribution (global vs. `scripts/setup-skills.mjs` clone into `.claude/skills/`). See the PR for the filed issue link.

## 7. Reproduction

1. `npx -y skills add https://github.com/cursor/plugins --skill thermo-nuclear-code-quality-review`
2. Invoke the skill (or apply `SKILL.md`'s prompt) against the target diff/files.
3. Filter findings through CLAUDE.md + `.claude/references/` before acting — never apply verbatim.
