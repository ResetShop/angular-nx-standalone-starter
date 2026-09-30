---
name: 💼 Release
about: Checklist for cutting a new starter release
title: 'Release vX.Y.Z'
labels: '💼 management, 🚀 release'
assignees: ''
---

## Setup (manual, before invoking the skill)

- [ ] Assign this issue to the target version's milestone (`X.Y.Z`) — the milestone title **is** the version the automation resolves. (Issue templates cannot auto-assign milestones.)
- [ ] Confirm this issue carries the `🚀 release` label — `prepare-release-pr.yml` gates on it.

## Skill-automated (via `/release-workflow <this-issue-url>`)

These steps are executed by the [`release-workflow`](../../.claude/skills/release-workflow/SKILL.md) skill, with user approval pauses:

- Verify the milestone has no open issues besides this one.
- Write the `## [X.Y.Z] — YYYY-MM-DD` section of `CHANGELOG.md` from the issues and pull requests shipped since the previous tag: a narrative per theme, the fork-migration checklist (only when a fork must act), a link to every merged pull request, and one line per issue.
- Rewrite this milestone's description as a one-paragraph summary of that narrative.
- Bump the `version` field in the root `package.json` to `X.Y.Z` (+ regenerate `package-lock.json`).
- Run `npm run ci` cold (`--skip-nx-cache`) and dry-run the release-notes extraction.
- Open the release-prep PR against `develop`.

## Action-automated (post-merge)

No manual action required:

- Merging the release-prep PR into `develop` → `prepare-release-pr.yml` creates/updates the `develop → main` release PR and dispatches CI against `develop`.
- Merging that PR into `main` → `release.yml` creates the `vX.Y.Z` tag and publishes the GitHub Release with the `CHANGELOG.md` section as notes.
- Railway deploys `main` via its native Git integration.

## Residual manual steps

- [ ] Merge the release-prep PR into `develop`, then review and merge the `develop → main` release PR (the automation never self-merges).
- [ ] Verify the Release workflow is green and the deployment is healthy (the `/api/health/v1` healthcheck returns `healthy`).
- [ ] Check that all tool and dependency versions referenced in `docs/` are current.

`(Add any release-specific tasks here, if needed.)`

## Acceptance criteria

- [ ] `npm run ci` passes cold (no cache).
- [ ] `CHANGELOG.md` has a `## [X.Y.Z]` section that lists every issue shipped in this release exactly once, and a fork-migration checklist backed by the pull requests' diffs.
- [ ] The milestone description summarises the same narrative.
- [ ] The `package.json` `version` matches the GitHub Release tag.
- [ ] Forks can pull the new tag without merge conflicts on starter-owned files.
