/**
 * Pure decision-logic helpers for `scripts/fork-init.mjs`.
 *
 * Kept side-effect-free (no fs/child_process access) so they can be unit-tested
 * without faking `git`/`gh` — the entry script owns all orchestration and stays
 * a thin wrapper around these decisions.
 */

/**
 * Canonical clone URL of the public starter. Every private mirror's `upstream`
 * remote points here (with its push URL disabled); `upstream-pull.mjs` uses the
 * same constant to self-heal a missing remote.
 */
export const UPSTREAM_REPO_URL = 'https://github.com/ResetShop/angular-nx-standalone-starter.git'

/**
 * Parses fork-init CLI arguments.
 *
 * Required: `--repo=<org>/<name>` (also accepted as `--repo <org>/<name>`).
 * Optional: `--app-name=<Display Name>` — human-readable name passed through to
 * `npm run generate:app`; `undefined` when omitted.
 *
 * Throws a descriptive Error on a missing or malformed `--repo` value.
 */
export function parseForkInitArgs(argv) {
	const repo = readArgValue(argv, '--repo')
	if (repo === undefined) {
		throw new Error('Missing required --repo=<org>/<name> argument (e.g. --repo=my-org/my-private-app)')
	}
	if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
		throw new Error(`Malformed --repo value "${repo}" — expected <org>/<name> (e.g. my-org/my-private-app)`)
	}
	const [org, name] = repo.split('/')
	return { org, name, appName: readArgValue(argv, '--app-name') }
}

/**
 * Derives the two remote URLs a mirror needs: its own private repo URL and the
 * canonical public starter URL its `upstream` remote points at.
 */
export function buildMirrorRemoteUrls(org, name) {
	return {
		mirrorRepoUrl: `https://github.com/${org}/${name}.git`,
		upstreamRepoUrl: UPSTREAM_REPO_URL,
	}
}

/**
 * Reads a single `--flag=value` or `--flag value` argument. Returns `undefined`
 * when the flag is absent or has no value.
 */
function readArgValue(argv, flag) {
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === flag) {
			return argv[i + 1]
		}
		if (argv[i].startsWith(`${flag}=`)) {
			return argv[i].slice(flag.length + 1)
		}
	}
	return undefined
}
