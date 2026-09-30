---
name: release-workflow
description: Orchestrates a release in 4 phases — Pre-flight, Prepare, Verify, Ship — from the release issue URL. Writes the release notes and the milestone description at release time; the issue's milestone title is the target version. Invoke with /release-workflow <issue-url>.
---

# Release Workflow

Orchestrates a **release** of the starter from its release-management issue (e.g. "Release v1.0.2"). Unlike [`issue-workflow`](../issue-workflow/SKILL.md), a release is **not a code feature** but a **deterministic checklist**: its steps are fixed, and the only variables are what fills them in (the milestone's issues and pull requests, written up as the release section, and the target version). That is why this skill encodes the checklist directly instead of reusing the feature flow (no `plan-writer`, no generic `code-reviewer`).

**Release notes are written here, once, at release time.** Feature pull requests never edit `CHANGELOG.md`. This skill reads what shipped since the previous tag, writes the whole release section — narrative, fork-migration checklist, one line per issue — and rewrites the milestone description from that narrative. The process follows [cuentoneta/cuentoneta's release workflow](https://github.com/cuentoneta/cuentoneta/blob/develop/.claude/skills/release-workflow/SKILL.md), adapted to a starter that forks merge.

Each invocation overwrites `workspace/RELEASE.md` and `workspace/milestone-description.txt` — save any prior session artifacts before starting a new invocation. (`workspace/` is gitignored.)

The rules in [`CLAUDE.md`](../../../CLAUDE.md) and [`coding-agent-policies.md`](../../references/coding-agent-policies.md) apply throughout. Full release mechanics (branch model, Actions, hotfixes): [`docs/release-process.md`](../../../docs/release-process.md).

## Usage

```
/release-workflow <issue-url>
```

Example: `/release-workflow https://github.com/ResetShop/angular-nx-standalone-starter/issues/545`

## Assumptions

- The issue is a **release-management issue** created from `.github/ISSUE_TEMPLATE/release.md`: it carries the **`🚀 release`** label (the `prepare-release-pr` Action gates on it), and its **milestone title is the target version** (e.g. milestone `1.0.2` → version `1.0.2`).
- The release ships by merging **`develop → main`**, which triggers `release.yml` (tag `v<version>` + GitHub Release from the CHANGELOG section). This skill prepares the release commits on a branch against `develop`; it **never** merges to `main`. After the prep PR merges into `develop`, the `prepare-release-pr` Action creates/updates the `develop → main` release PR.

---

## Phase 1 — Pre-flight

**Purpose:** Gather what shipped, draft the release section and the milestone description, and surface blockers — without committing anything yet.

1. Run `gh issue view <issue-url> --json number,title,milestone` → issue number, title, **target version** (`milestone.title`) and **milestone number** (`milestone.number`). The milestone number is what Phase 4 uses to update the description; it differs from both the issue number and the version.
2. **Verify the milestone is complete (acceptance criterion):** `gh issue list --milestone "<version>" --state open`. No issue may remain open **except the release issue itself**. If others remain, report them and pause — the release is not ready.
3. **Branch:** `git checkout develop && git pull --ff-only`, then `git checkout -b <number>-<kebab-case-title>` (branch convention from `CLAUDE.md`). Releases always branch from `develop` — never from the resolved default branch of a fork.
4. **Gather what shipped.** Take the previous release tag by version: `git tag --list 'v*' --sort=-v:refname | head -n 1`. Do not use `git describe` from `develop`: release tags sit on the merge commit the release PR creates on `main`, which is not part of `develop`'s history, so `git describe` skips them and returns an older tag. The range `<previous-tag>..origin/develop` is still correct, because everything `develop` had at that release is reachable from the tag. Then:
   - list the pull requests merged since it: `git log --first-parent --format='%H %s' <previous-tag>..origin/develop` (numbers from `Merge pull request #N` subjects, or a trailing `(#N)` on squash merges);
   - read each one with `gh pr view <N> --json number,title,body,closingIssuesReferences,milestone`;
   - list the milestone's closed issues with `gh issue list --milestone "<version>" --state closed`.

   The release covers the **union** of the milestone's closed issues and the issues closed by the merged pull requests. Include issues without a milestone that shipped in the window. Report as a red flag any shipped issue whose milestone is a **future** one, and any milestone issue with no merged pull request (research, duplicates, won't-fix): those usually get no line, but say why. Exclude the release issue and the release-prep pull request themselves.

5. **Draft the release section**, using the previous section of `CHANGELOG.md` as the model for structure and tone (the `1.1.0` section is the reference):
   - Heading `## [<version>] — <today's date, YYYY-MM-DD>`.
   - **Opening sentence** saying what kind of release this is. When step 6 finds fork actions, point readers to **Fork migration**; when it finds none, say "No fork action is needed."
   - **One paragraph per theme**, the theme word in **bold**, in plain English: what changed and why it matters to someone using the starter. Cite issues inline as `[#N]`. Themes come from the issue set; three to five is typical.
   - `### Fork migration` — the output of step 6. **Omit the heading entirely when step 6 finds nothing.**
   - `### Full changes` — `See every merged pull request in [v<version>](https://github.com/ResetShop/angular-nx-standalone-starter/releases/tag/v<version>).`
   - `### Changes` — `#### <Theme>` groups in the same order as the paragraphs, each a list of `- [#N] - <Present-tense sentence>.` lines. **Every shipped issue appears exactly once.**
   - Link definitions at the end of the section, one per cited issue in ascending order: `[#N]: https://github.com/ResetShop/angular-nx-standalone-starter/issues/N`. GitHub does not autolink `#N` inside repository files; these make the references clickable both in `CHANGELOG.md` and on the Release page.

   Leave implementation detail to the pull requests. The section says _what_ changed and _why_, in a sentence each; the pull requests already say _how_.

6. **Work out the fork migrations** by following [`fork-migration-scan.md`](fork-migration-scan.md) over `<previous-tag>..origin/develop`. It produces the `### Fork migration` checklist and an evidence table for `workspace/RELEASE.md`, and marks anything it cannot resolve from the diff as **`NEEDS MAINTAINER INPUT`**.
7. **Draft the milestone description**: one paragraph that condenses the section's narrative — the same themes, in the same order, without the per-issue list. It is the version's summary in GitHub's milestone list. Save it to `workspace/milestone-description.txt`. **Derive it from the prose; never write it separately.** Any later edit to the prose re-derives it.
8. **Check documented tool versions:** compare `docs/` and `README.md` version references (Node, npm, major framework versions) against `package.json` (`engines`, key dependency majors). Only a documentable major jump requires an edit — not routine minor/patch bumps.
9. Write `workspace/RELEASE.md` with: target version, milestone number and status, the window (`<previous-tag>..<develop sha>`, pull request count), an **issue coverage table** (issue → theme, or excluded and why), the documentation delta (if any), the **draft section** exactly as it will be inserted, the **fork-migration evidence table**, and the **milestone description** draft.

**⏸ PAUSE — User approval required.**

> The release scope, the draft release section with its fork-migration evidence, and the milestone description are in `workspace/RELEASE.md`. Review it and reply **approve**, or give me feedback on the scope, grouping, prose, fork actions or milestone description.

Resolve every `NEEDS MAINTAINER INPUT` row before approval. Feedback on the prose re-derives the milestone description. Do not proceed until the user approves.

---

## Phase 2 — Prepare

**Purpose:** Materialize the release notes and the version bump as atomic commits.

1. **Add the release section:** insert the approved section directly below the file header, above the most recent `## [` section, and add `[<version>]: https://github.com/ResetShop/angular-nx-standalone-starter/releases/tag/v<version>` at the top of the version links at the bottom of the file. Commit: `[#<issue>] - Add <version> release notes to CHANGELOG`.
2. **Bump the version:** set `"version": "<version>"` in the root `package.json`, then run `npm install` so `package-lock.json` mirrors it. This is a **single root bump** — `packages/*` versions are inert under the fork-distribution model and must not be touched. Check that the lockfile diff is the two `version` lines only. Commit: `[#<issue>] - Bump version to <version>`.

Each commit leaves the repo buildable.

---

## Phase 3 — Verify

**Purpose:** Prove the release will not break the automated pipeline, and that the notes are complete.

1. Run **`npm run ci`** (cold, `--skip-nx-cache`) — the authoritative final gate per `CLAUDE.md`. Release notes and a bump touch no runtime code, but the gate runs regardless, by policy.
2. **Dry-run the release-notes extraction from `release.yml`:** run the `awk` from [`docs/release-process.md`](../../../docs/release-process.md) §5 ("Dry-running the automation") with `ver="<version>"`, exactly as written there, and confirm it returns a **non-empty** section that ends before the previous `## [` heading and includes the link definitions. An empty result means the release job will fail. (The command is not repeated here because the skill loader replaces `$`-number placeholders with the invocation arguments, which would corrupt the `awk`.)
3. **Check the notes are complete:** every shipped issue from Phase 1 step 4 has exactly one `### Changes` line; every `[#N]` cited has a link definition, and no definition is unused.
4. **Check the fork warning fires as intended:** pass the section's added lines to `detectChangelogWarnings` in `scripts/lib/upstream-pull.helpers.mjs`:

   ```bash
   git diff origin/develop -- CHANGELOG.md | node --input-type=module -e "import { detectChangelogWarnings } from './scripts/lib/upstream-pull.helpers.mjs'; let d = ''; process.stdin.on('data', (c) => (d += c)).on('end', () => console.log(detectChangelogWarnings(d)))"
   ```

   With a `### Fork migration` section, `hasAny` must be `true`, so `upstream:pull` pauses forks. Without one, `hasAny` should be `false`; if it is `true`, find the "migration" or "breaking" wording elsewhere in the section and reword it, or confirm with the user that the pause is intended.

5. **Tag availability:** confirm `git ls-remote --tags origin "refs/tags/v<version>"` returns nothing — a pre-existing tag would turn the release job into a silent no-op.
6. **Re-confirm the milestone gate** (Phase 1 step 2) — issues may have been reopened while preparing.

Record the results in `workspace/RELEASE.md`. If anything fails: diagnose, fix with an atomic commit, and re-verify.

**⏸ PAUSE — User decision required.**

> Verification results are in `workspace/RELEASE.md`. Reply **proceed** to open the PR and apply the approved milestone description, or give me feedback.

Do not proceed until the user decides.

---

## Phase 4 — Ship + manual handoff

**Purpose:** Open the release-prep PR, update the milestone, and hand off the manual steps that trigger the release.

1. `git push -u origin <branch-name>`.
2. Create the PR with `gh pr create --base develop` (milestone set to the target version):
   - Title: `[#<issue>] - <issue title>`.
   - Body with **`Closes #<issue>`** (hard constraint: the closing keyword must be in the body — the title prefix does not create the link).
   - Include the manual-steps block (below) so it is recorded on the PR.
3. **Apply the milestone description** approved in Phase 1:

   ```bash
   gh api repos/:owner/:repo/milestones/<milestone-number> --method PATCH -F description=@workspace/milestone-description.txt
   gh api repos/:owner/:repo/milestones/<milestone-number> --jq .description
   ```

   The file input keeps quotes and backticks intact. Read the description back, record it in `workspace/RELEASE.md`, and report it as **applied** only if it matches the file. If the call fails, report it as **pending** with the reason.

4. Present the PR URL and the **manual handoff block** to the user:

   ```
   Manual steps to complete the release:
   1. Merge this PR into `develop` (the release issue must carry the 🚀 release label).
   2. After the merge, the `prepare-release-pr` Action creates/updates the `develop → main`
      release PR and dispatches ci.yml against develop (the PR cannot trigger checks itself
      because it is created by GITHUB_TOKEN; the CI signal is the run on develop).
      Review that PR and merge it into `main`
      → triggers release.yml (tag v<version> + GitHub Release from the CHANGELOG section).
      Railway deploys `main` via its native Git integration — no workflow involvement.
      If the milestone was not complete, the Action skips with a warning; re-trigger via
      workflow_dispatch with force=true if appropriate.
   3. Verify post-release: Release workflow green, Release v<version> published with the
      CHANGELOG notes, and the production app healthy via /api/health/v1.
   ```

5. Present the final summary (version, branch, PR, commits, verification results, milestone description status).

---

## Constraints (apply to all phases)

- Never use direct `nx` commands — always `npm run <task>`.
- Never prefix git commands with `cd` — the working directory is already at project root.
- Never use HEREDOC (`$(cat <<'EOF'...)`) substitution in commit messages.
- Never merge `develop → main` from this skill: that merge is the release trigger and belongs to the user.
- Never run `gh release create` or push tags from this skill: `release.yml` owns tag and Release creation.
- Never open the PR without `Closes #<issue>` in the body, nor before the cold `npm run ci` gate and Phase 3 verification pass.
- The version bump is a **single root bump** (`package.json` + regenerated `package-lock.json`); `packages/*` versions are never touched.
- Never skip Phase 3 step 2 (the extraction dry-run) — it is the only pre-merge proof that `release.yml` will find the release notes.
- Every issue shipped in the window appears exactly once in `### Changes`; every fork-migration line is backed by a row in the evidence table.
- Never write the milestone description separately from the section's prose, and never apply a description the user has not approved.
- `CHANGELOG.md` changes only in this skill's Phase 2 (and in hotfixes, per `docs/release-process.md`); feature pull requests never edit it.
- All `.claude/references/coding-agent-policies.md` rules apply throughout.
