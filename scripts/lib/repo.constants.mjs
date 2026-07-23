/**
 * Shared repository constants for the fork/mirror CLI scripts.
 *
 * Canonical clone URL of the public starter. `fork-init.mjs` wires every
 * private mirror's `upstream` remote to it (with the push URL disabled), and
 * `upstream-pull.mjs` uses the same constant to self-heal a missing `upstream`
 * remote — the two scripts must always agree on where "upstream" lives.
 */
export const UPSTREAM_REPO_URL = 'https://github.com/ResetShop/angular-nx-standalone-starter.git'
