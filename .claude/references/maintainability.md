# Maintainability & Structural Simplification

An **ambition lens** for reviews and refactors: don't stop at "this could be a little cleaner." Actively look for restructurings that make a change _dramatically simpler_ without altering behavior — and **prefer deleting complexity over rearranging it**.

This file complements, and never overrides, the hard constraints in CLAUDE.md and the principles in [`solid.md`](solid.md), [`cupid.md`](cupid.md), [`clean-architecture.md`](clean-architecture.md), and [`guiding-principles.md`](guiding-principles.md). It is **inspired by an evaluation of Cursor's `thermo-nuclear-code-quality-review` skill** (issue [#409](https://github.com/ResetShop/angular-nx-standalone-starter/issues/409)); the ideas are re-expressed here in this project's voice so they apply with full project context.

## Core stance

- Search for the **"code judo" move** — a re-organization that uses the existing architecture more effectively and makes the change feel inevitable in hindsight, so whole branches, helpers, modes, conditionals, or layers disappear entirely.
- Reward implementations that **remove moving pieces**, not refactors that merely spread the same complexity around.
- Bias toward **direct, boring, legible** code over clever/magical mechanisms. "It works" is not sufficient if it leaves the codebase messier.

## Smells to flag

These are deliberately the ones our other references under-weight (size/typing/naming/test/security smells already live in CLAUDE.md and the other refs — don't re-litigate those here):

- **Spaghetti growth.** New ad-hoc conditionals, one-off booleans, nullable "modes", or special-case branches bolted onto an existing unrelated flow. Treat as a _design_ problem, not a style nit — push the logic into a dedicated abstraction, helper, state machine, or policy object.
- **Thin / identity / pass-through wrappers.** Abstractions that add a layer of indirection without buying clarity. Flag generic "magic" that hides a simple data-shape assumption.
- **Diff-driven file bloat.** Even though CLAUDE.md caps files at **≤ 500 lines** (the absolute limit — that always wins), also ask whether _this PR_ meaningfully grew a file: if the new code could be split into a focused module/subcomponent, prefer decomposing first rather than letting the file sprawl toward the cap.
- **Avoidable orchestration.** Independent work serialized for no reason (prefer parallel — mirrors the advisor-fan-out rule in CLAUDE.md "Agent Orchestration"), or related updates that can leave state half-applied (prefer a more atomic structure). Don't micro-optimize, but do flag brittleness.
- **"Temporary" branching** that is likely to become permanent debt.

## Primary questions for each meaningful change

- Is there a reframing that needs **fewer concepts, branches, or helper layers**?
- Did the diff add branching where a **better abstraction** should exist, or make a previously cohesive module more coupled / more stateful / harder to scan?
- Is this abstraction **earning its keep**, or is it a wrapper around one call site?
- Could whole categories of complexity be **deleted** rather than polished?

## Preferred remedies (in order of preference)

1. **Delete a layer** of indirection rather than refining it.
2. **Reframe the state model** so conditionals disappear instead of getting centralized.
3. **Move the ownership boundary** so the feature becomes a natural extension of an existing abstraction.
4. Turn special-case logic into a **simpler default flow** with fewer exceptions.
5. Extract a pure helper, or split a large file into focused modules.

## Guardrails — stay project-aware

Apply this lens **inside** the project's conventions; a generic "simplify" instinct must never contradict a mandated pattern. In particular, do **not** recommend changes that fight CLAUDE.md, e.g.:

- the two-block `withMethods` store structure (it is mandated; not "duplication to merge");
- `rxMethod` over promises in `src/app/` stores;
- `find*()` repository / `get*()` service naming;
- file-local `Projection` types; `Object.freeze()` over enums;
- guarding Drizzle guaranteed-single-row results (boring is correct there).

When a simplification would violate a hard constraint or an established convention, **drop it** — the constraint wins. Surface only restructurings that are both simpler **and** convention-compliant.
