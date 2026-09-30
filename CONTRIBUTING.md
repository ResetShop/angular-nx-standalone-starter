# Contributing

This repository is **public for transparency and reuse** under the [Apache-2.0](./LICENSE.md) license.

## Contribution policy

- **Issues are welcome from anyone.** Bug reports and feature requests from outside the org are
  encouraged — please open an issue.
- **Pull requests are accepted from [ResetShop](https://github.com/ResetShop) org members only.**
  Anyone can fork and open a PR, but PRs from non-members are automatically closed by a GitHub
  Actions workflow with a short policy note. If you are a ResetShop member and your PR was closed in
  error, the membership-check token (`ORG_READ_TOKEN`) may have expired — please contact a maintainer.

If you have found a security vulnerability, do **not** open a public issue — see
[`SECURITY.md`](./SECURITY.md).

The rest of this document is the internal workflow for org members.

## Branch naming

`<issue#>-<kebab-title>`

```
87-add-user-authentication
203-fix-pagination-off-by-one-error
```

## Commit messages

`[#<issue>] - <title>`

```
[#87] - Add login form component
[#203] - Fix off-by-one error in pagination component
```

## Pull requests

- **Title:** `[#<issue>] - <title>` (same format as commits).
- **Body:** include a `Closes #<issue>` line so the PR links and auto-closes its issue on merge.
- Keep the PR scoped to a single issue.

## Release notes

Do not edit [`CHANGELOG.md`](./CHANGELOG.md) in a pull request. Release notes are written once per
release, at release time, by the maintainers with the `/release-workflow` Claude Code skill. It reads
what the merged pull requests changed and writes the release section, including what forks must do.

A clear pull request description helps it: say what changed, and anything a fork would have to adapt
(a renamed export, a new translation key, a changed endpoint).

## Bypass label

One bypass label exists, for a pull request that legitimately modifies a path under `apps/` other than
`apps/reference-app` (for example, renaming the reference app): `allow-app-change`. Applying or removing
it re-runs the boundary guard, so you don't need to push a new commit.

## CI gate

`npm run ci` must pass with exit code `0` before a PR is opened. All task execution goes through
`npm run <task>` — direct `nx` commands are not supported.

## Issue & development workflow

The `/issue-workflow <issue-url>` Claude Code skill (`.claude/skills/issue-workflow/SKILL.md`)
orchestrates the full lifecycle — Setup → Plan → Implement → Review → Fix → Ship — and is the
recommended entry point for any new issue.

## Forking

For fork-specific guidance (creating apps from the schematic, pulling upstream changes, ownership
boundaries, the changelog contract), see [`docs/forking.md`](./docs/forking.md).

## Code of Conduct

All participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).
