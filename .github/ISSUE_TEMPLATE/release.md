---
name: 💼 Release
about: Checklist for cutting a new starter release
title: 'Release vX.Y.Z'
labels: '💼 management'
assignees: ''
---

## Tasks

- [ ] Promote the `## [Unreleased]` entries in `CHANGELOG.md` to `## [X.Y.Z] — YYYY-MM-DD`.
- [ ] Bump the `version` field in the root `package.json` to `X.Y.Z`.
- [ ] Run `npm run ci` cold (`--skip-nx-cache`) and confirm exit code 0.
- [ ] Create the GitHub Release from the `main` branch tag, copying the relevant `CHANGELOG.md` section as the release notes.
- [ ] Verify the deployment succeeds (the `/api/health/v1` healthcheck returns `healthy`).
- [ ] Check that all tool and dependency versions referenced in `docs/` are current.

`(Add any release-specific tasks here, if needed.)`

## Acceptance criteria

- [ ] `npm run ci` passes cold (no cache).
- [ ] `CHANGELOG.md` has no `## [Unreleased]` items that belong in this release.
- [ ] The `package.json` `version` matches the GitHub Release tag.
- [ ] Forks can pull the new tag without merge conflicts on starter-owned files.
