<!--
  Thanks for opening a PR against the upstream starter repo!
  Please fill in this template before requesting review.

  This template is intended for PRs against the upstream
  ResetShop/angular-nx-standalone-starter repository. Forks may delete or
  replace this file with their own template — the upstream-specific
  checklist below does not apply to fork-internal PRs (the boundary guard
  is also gated to upstream only).
-->

## Summary

<!-- 1–3 sentences describing what this PR does and why. -->
<!-- Add `Closes #<issue-number>` on a line by itself so GitHub links and auto-closes the issue on merge. -->

## Test plan

<!-- Bullet list of what you ran / what reviewers should verify. -->

- [ ] `npm run ci` passes locally

## Fork-distribution checklist

This repo follows a fork + upstream-merge distribution model (see [docs/forking.md](https://github.com/ResetShop/angular-nx-standalone-starter/blob/main/docs/forking.md)). Upstream PRs must respect a few constraints — please confirm:

- [ ] **No CHANGELOG edit.** This PR does not touch `CHANGELOG.md`. Release notes, including what forks must do, are written once per release by the maintainers (`/release-workflow`).
- [ ] **No fork-owned paths touched.** I have not modified any path under `apps/` other than `apps/reference-app`. _If this PR is a legitimate exception (e.g. renaming the reference app), apply the `allow-app-change` label to bypass the boundary guard._
- [ ] **CI guards reviewed.** I have read the messages from `boundary-guard` (if any) and addressed them rather than bypassed them with a label.

## Additional notes

<!-- Anything reviewers should know that doesn't fit above. -->
