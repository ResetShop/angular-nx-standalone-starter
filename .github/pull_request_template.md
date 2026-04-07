<!--
  Thanks for opening a PR against the upstream starter repo!
  Please fill in this template before requesting review.

  This template is intended for PRs against the upstream
  ResetShop/angular-nx-standalone-starter repository. Forks may delete or
  replace this file with their own template — the upstream-specific
  checklist below does not apply to fork-internal PRs (the boundary and
  changelog guards are also gated to upstream only).
-->

## Summary

<!-- 1–3 sentences describing what this PR does and why. -->

## Test plan

<!-- Bullet list of what you ran / what reviewers should verify. -->

- [ ] `npm run ci` passes locally

## Fork-distribution checklist

This repo follows a fork + upstream-merge distribution model (see [docs/forking.md](https://github.com/ResetShop/angular-nx-standalone-starter/blob/main/docs/forking.md)). Upstream PRs must respect a few constraints — please confirm:

- [ ] **CHANGELOG entry added.** If this PR modifies starter-owned code (`packages/*`, `apps/reference-app`, root config, `scripts/`, `.github/workflows/`, docs), I have added an entry under `## [Unreleased]` in `CHANGELOG.md` describing the change. _If this PR is a typo fix, comment-only change, or internal refactor with no fork-visible impact, apply the `skip-changelog` label to bypass the guard._
- [ ] **No fork-owned paths touched.** I have not modified any path under `apps/` other than `apps/reference-app`. _If this PR is a legitimate exception (e.g. renaming the reference app), apply the `allow-app-change` label to bypass the boundary guard._
- [ ] **CI guards reviewed.** I have read the messages from `boundary-guard` and `changelog-guard` (if any) and addressed them rather than bypassed them with a label.

## Additional notes

<!-- Anything reviewers should know that doesn't fit above. -->
