/**
 * Pure decision-logic helpers for `scripts/fork-init.mjs`.
 *
 * Kept side-effect-free (no fs/child_process access) so they can be unit-tested
 * without faking `git`/`gh` — the entry script owns all orchestration and stays
 * a thin wrapper around these decisions.
 */
import { UPSTREAM_REPO_URL } from './repo.constants.mjs'

/**
 * Parses fork-init CLI arguments.
 *
 * Required: `--repo=<org>/<name>` (also accepted as `--repo <org>/<name>`).
 * Optional: `--app-name=<Display Name>` — human-readable name passed through to
 * `npm run generate:app`; `undefined` when omitted.
 *
 * Throws a descriptive Error on a missing or malformed `--repo` value and on an
 * `--app-name` value outside the safe character set. Both values are later
 * interpolated into shell command strings by the entry script, so the
 * allowlists double as shell-quoting safety: every permitted character is inert
 * inside a double-quoted argument on both cmd.exe and POSIX shells.
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
	const appName = readArgValue(argv, '--app-name')
	if (appName !== undefined && !/^[A-Za-z0-9][A-Za-z0-9 ._-]*$/.test(appName)) {
		throw new Error(
			`Malformed --app-name value "${appName}" — allowed: letters, digits, spaces, dots, hyphens, underscores (must start with a letter or digit)`,
		)
	}
	return { org, name, appName }
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
 * when the flag is absent or has no value. A following `--`-prefixed token is
 * another flag, not a value — treating it as missing surfaces the accurate
 * "missing argument" error instead of a misleading "malformed value" one.
 */
function readArgValue(argv, flag) {
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === flag) {
			const next = argv[i + 1]
			return next !== undefined && next.startsWith('--') ? undefined : next
		}
		if (argv[i].startsWith(`${flag}=`)) {
			return argv[i].slice(flag.length + 1)
		}
	}
	return undefined
}
