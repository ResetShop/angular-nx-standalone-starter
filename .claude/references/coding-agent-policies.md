# Coding Agent Collaboration Policies

> **Audience:** any AI coding agent operating on this repository (Claude Code, Cursor, Aider, GitHub Copilot Chat, etc.) and any human reviewer evaluating an agent-produced PR.
>
> **Authority:** these policies are a hard constraint at the same level as the conventions in [`CLAUDE.md`](../../CLAUDE.md). Violations are review-blocking.
>
> **Tracking issue:** [#262](https://github.com/ResetShop/angular-nx-standalone-starter/issues/262) is the canonical location for proposing amendments.

---

## Why this document exists

This repository is a **multi-collaborator showcase**. The way work is structured here informs every project that follows. Recommendations that quietly trade rigor for ceremony — even when well-intentioned — set the wrong precedent for downstream consumers and for the development culture of any team that copies patterns from this repo.

Coding agents have a particular failure mode: when weighing alternatives, they default to optimizing for the agent's perceived cost (time, context window, API calls) rather than for the long-term health of the codebase. This document codifies the rules that prevent that failure mode.

---

## Section 1 — The no-solo-maintainer rule

### Rule

When recommending between alternatives that trade off rigor against ceremony — for example:

- One big PR vs. multiple small PRs
- Single commit vs. multiple atomic commits
- Inline doc vs. separate file
- Skipping tests vs. writing them
- Skipping code review vs. running it
- Hand-waving an edge case vs. covering it

— **never** use any of the following framings as a tie-breaker, side question, or cost-saving justification:

- "If you're the only maintainer..."
- "If this is solo work..."
- "If nobody else is going to review..."
- "Since you're the primary contributor..."
- "If this is just for you..."
- Any equivalent solo-assumption framing

Do not include those phrases as **conditional clauses** in recommendations either ("if X is true then this is fine, otherwise that").

### Why

1. **The user has explicitly stated this repository is a multi-collaborator showcase.** Suggesting shortcuts on solo-maintenance assumptions misreads the actual context.
2. **Even if the user were the only maintainer**, the precedent exists for future contributors who copy patterns from this repo into their own work. The solo-maintainer escape hatch poisons the well for everyone downstream.
3. **A coding agent is not in a position to assess maintainership context.** The agent sees the repo at one moment in time; it does not see who will read the code in six months, what compliance review will hit it, or what onboarding story matters for the team.

### How to apply

- **Default to the rigorous / multi-collaborator-friendly choice** and present that as the recommendation, not as the "if N people" branch.
- If a lighter option is genuinely worth mentioning, frame it as "the lower-cost option, with the understanding that we accept X loss of rigor" — never as "fine if it's just you."
- Apply this in code reviews, plan structuring, PR strategy, refactoring decisions, test coverage decisions, documentation decisions, and any other place where the agent might be tempted to optimize for solo workflow.
- This policy is a hard rule, not a preference. Reviewers may cite this section to block a PR.
- Specific commit and PR conventions are defined in [`CLAUDE.md`](../../CLAUDE.md) under the Development Workflow section; this section governs the **framing** of recommendations touching those conventions, not the conventions themselves.

### Good vs. bad recommendation framing

**Bad** (forbidden):

> "Option A bundles all changes into a single PR. Option B splits them across several smaller PRs. **If you're the only one reviewing, A is fine** — it's faster and you avoid the merge ceremony. Otherwise B is cleaner."

**Good** (preferred):

> "Option A bundles all changes into a single PR. Option B splits them across several smaller PRs. **B is the recommendation**: each PR is independently reviewable, revertable, and traceable to its own issue. A is the lower-rigor option — it skips the per-area review story and concentrates merge risk in a single event. Pick A only if you've explicitly accepted those losses."

---

## Section 2 — Other shortcut anti-patterns

The following recommendations are banned. The list grows over time as new failure modes are discovered. **Additions follow the same amendment process as all changes:** propose via issue [#262](https://github.com/ResetShop/angular-nx-standalone-starter/issues/262), require explicit user approval.

### "We can skip tests for this small change"

Forbidden. Tests exist for a reason; "small" is not a measure of risk. Even a one-line bug fix should land with a regression test that would have caught the original bug. The agent's job is to write the test, not to argue against writing it.

**Scope:** this rule applies to any change that modifies runtime behaviour — logic, configuration values that the application reads at runtime, schemas, or API contracts. **Documentation-only changes** (Markdown files, comments without code changes) **and tooling-config-only changes** (linter rules, prettier settings, CI workflow YAML, etc., where the change has no runtime effect on the application) are exempt from the test requirement.

### "Let's just delete the file since it's gitignored anyway"

Forbidden for files under `workspace/`. That directory is gitignored but its contents are intentionally authored — plans, code reviews, audit notes, issue maps. Do not delete any file under `workspace/` without explicit user instruction, regardless of its gitignored status. For files outside `workspace/`, use standard judgment: if the file's existence was explicitly requested or referenced by the user in any committed file (CLAUDE.md, docs, etc.), do not delete it without confirmation.

### "The code review can wait until after the PR opens"

Forbidden. The plan for this repo specifies that the local code-reviewer agent runs **before opening the PR**, so that PR reviewers see code that has already been polished. Pushing the branch is fine; opening the PR before the local review is not.

### "Let's hand-wave the edge case in a comment"

Forbidden. If an edge case can be enumerated in a comment, it can be enumerated in a test. Comments document intent; tests enforce it. The agent should write the test.

---

## Section 3 — Asking clarifying questions

Agents may ask clarifying questions when the user's instruction is genuinely ambiguous. Agents may not ask questions whose answer would change which option the agent recommends along the rigor / ceremony axis. Specifically:

- ✅ "Should the new schematic accept a `--directory` flag?" — substantive ambiguity, ask.
- ✅ "Do you want the changelog entry under Added or Changed?" — substantive ambiguity, ask.
- ✅ "Should the new component support both light and dark themes from day one, or land light-only and add dark in a follow-up?" — substantive product question, ask.
- ❌ "Are you the only person who will review this?" — banned, never ask.
- ❌ "How important is it that the tests cover this edge case?" — banned **as a way of getting permission to skip writing the test**. The question is acceptable only when it would clarify what the test should assert, not whether to write it. If you find yourself wanting to ask this so you can avoid writing the test, write the test instead.
- ❌ "Is it OK if I skip the code review for this small PR?" — banned, never ask.
- ❌ "Is it OK to skip the Storybook story since the component is simple?" — banned, never ask. The answer is always to write the story.

---

## Section 4 — Memory retention (vendor-neutral principle)

Agents that have a persistent local memory system should save a feedback-style record codifying these rules so the rules survive context loss between sessions. The local memory does not replace this document — the document is the authoritative version that human reviewers and other agents can cite, and the document is portable across agent vendors. The local memory is the tactical reinforcement for one specific agent's behaviour between its own sessions.

The principle: **the document is canonical; the memory is reinforcement**. If the two ever disagree, the document wins and the memory is updated.

> **Claude Code specifics:** the local memory file lives at `~/.claude/projects/<project-id>/memory/feedback_no_solo_maintainer_assumption.md` and is indexed from `MEMORY.md` under "Process & Recommendation Hygiene". Other agents (Cursor, Aider, Copilot Chat, etc.) should use whatever equivalent persistence mechanism they have, or — if they have none — load this document at the start of every session via the project's contextual file inclusion mechanism (e.g. `.cursorrules`, `.aiderrules`, etc.).

---

## Section 5 — Enforcement

### For agents

- Read this document at session start, every session, unconditionally.
- If a recommendation would violate any rule above, **revise the recommendation before presenting it** rather than presenting the violation and adding a caveat.
- If a user instruction would force a violation (e.g. "skip the tests for this one"), surface the conflict explicitly: "This would violate `coding-agent-policies.md` Section 2. Confirm you want me to proceed anyway."

### For human reviewers

- A PR description that contains any of the banned phrasings is review-blocking. Request changes citing this document by section.
- A PR that omits tests on the basis of "this is small" is review-blocking. Request the missing tests.
- A PR opened without a local code-reviewer pass (when the workflow specifies one) is review-blocking. Request the pass before merging.

### Amendments

Propose changes by commenting on issue [#262](https://github.com/ResetShop/angular-nx-standalone-starter/issues/262). Amendments require explicit user approval before merging into this document. **Every PR that modifies this file must update the "Last updated" date in the footer below** — this is enforced by convention, not by tooling.

---

## Section 6 — Code comment quality

### Rule

When writing or modifying a code comment in a `.ts`, `.spec.ts`, `.stories.ts`, or generator template file, **never** introduce:

- An **issue or PR number token** — `#499`, `(see #468)`, `regression guard for #471`, `tracked as the follow-up (#453)`.
- **Before/after-issue framing** — `Since #497 the hasher reads…`, `Pre-#331 this was camelCase`, `#480 removed the unreachable link`, `out of scope for #317`.
- **"Formerly X" / "moved here from" framing** — `moved here from the former auth.env.ts`, `was previously a single Pool()`.

Comments must describe the **present state and rationale** — what the code does and why it must be this way now.

### Where the change-narrative lives

A code comment and the change-narrative are complementary and must never be conflated:

- A **code comment** documents the *present invariant* — what the code does and why it must be this way now.
- A **PR description and its issue thread** document the *change that produced it* — why it changed, what it replaced, the before/after story, and the issue/PR cross-references.

**PRs and issues are the canonical home for that change-narrative documentation.** When you are tempted to record *why a change was made* or *what it used to be*, that belongs in the PR description and the issue thread — with `CHANGELOG.md` carrying the fork-facing summary and `git log` / `git blame` the "when/who" — **never** inline in a code comment. Pushing change-history into a comment both rots the comment (the "before" no longer exists in the tree) and hides the narrative from where reviewers and forks actually look for it.

### Why (agent-specific failure mode)

Agents writing implementation comments tend to explain **their own change in context** — "since #497 the hasher reads from `passwordEnv`", "this replaces the former monolithic env" — because that is the framing in which the agent is operating at authoring time. That framing is invisible-but-correct to the agent in the moment and meaningless to the next reader, who sees only the present tree. This is exactly the pattern the rule prevents: write the invariant the code upholds, not the diff that produced it.

### How to apply

- Replace `// regression guard for #471` with a plain-English statement of the invariant being guarded (e.g. `// The root ToastBridgeService is a singleton — exactly one instance renders the deny notification`).
- If you are tempted to cite an issue so the reader "can get the context", that context belongs in the PR description or `CHANGELOG.md` entry — put it there instead.

### Exemptions

- `CHANGELOG.md` entries **should** cite issues — that is their purpose.
- `docs/`, `README.md`, `CLAUDE.md`, and `.claude/references/` files may use **hyperlinked** issue references as durable cross-references (this document's own `[#262](…)` amendment-tracking links are an example). Bare `#<n>` tokens in prose are still discouraged in favor of durable descriptions.

### Enforcement

`scripts/check-no-issue-refs-in-comments.mjs` scans every `.ts` file under `apps/` and `packages/` and fails on any `#<n>` token appearing in a `//` or block-comment line. It runs in the pre-commit hook and in both `npm run ci` and `npm run ci:verify`. A violation fails the build.

---

_Last updated: 2026-06-20. Section 6 (code comment quality) added, including the "Where the change-narrative lives" rule naming PRs and issues as the canonical home for change-narrative documentation. Initial version created as part of milestone #3 (Monorepo restructure + fork distribution)._
