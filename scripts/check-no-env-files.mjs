#!/usr/bin/env node
/**
 * Fails if any tracked-or-untracked `.env*` file exists at the repository root
 * or inside `apps/*`.
 *
 * The repo's contract (see `docs/environment-variables.md`):
 *   - Every backend env variable is declared in the Zod sub-schemas under
 *     `apps/reference-app/src/api/config/*.env.ts` and consumed exclusively as
 *     `<domain>Env.VAR_NAME` via the `@config/*` path alias.
 *   - How developers deliver values to `process.env` (out-of-tree env file +
 *     Node `--env-file`, IDE run config, shell export, direnv) is left to them.
 *   - **No `.env*` file may exist in the working tree** — this script is the
 *     structural defense, run from the pre-commit hook AND `npm run ci`.
 *
 * Why both layers:
 *   - Pre-commit catches the file the moment someone tries to commit it.
 *   - CI catches the case where the hook was bypassed (`--no-verify`) or the
 *     file slipped in through a different path (rebase, manual git op, agent
 *     misbehavior). Belt-and-braces by design.
 *
 * Allowed exceptions: none. The legacy `.env.example` file was removed when
 * `docs/environment-variables.md` took over its role.
 *
 * Exit codes: 0 = clean, 1 = forbidden file found.
 */
import { readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))

const SEARCH_ROOTS = [REPO_ROOT, join(REPO_ROOT, 'apps')]

const FORBIDDEN_PATTERN = /^\.env(\..+)?$/

function findEnvFiles(dir) {
	const found = []
	let entries
	try {
		entries = readdirSync(dir)
	} catch {
		return found
	}
	for (const name of entries) {
		const fullPath = join(dir, name)
		let stats
		try {
			stats = statSync(fullPath)
		} catch {
			continue
		}
		if (stats.isDirectory()) {
			// Only descend into `apps/<slug>/`, not deeper. We are not scanning
			// node_modules, dist, .nx, etc. — those legitimately may carry env
			// fixtures and are not part of the source tree contract.
			if (dir === join(REPO_ROOT, 'apps')) {
				found.push(...findEnvFiles(fullPath))
			}
			continue
		}
		if (FORBIDDEN_PATTERN.test(name)) {
			found.push(fullPath)
		}
	}
	return found
}

const offenders = []
for (const root of SEARCH_ROOTS) {
	offenders.push(...findEnvFiles(root))
}

if (offenders.length > 0) {
	console.error('FATAL: forbidden .env* file(s) detected in the working tree:')
	for (const path of offenders) {
		console.error(`  - ${relative(REPO_ROOT, path)}`)
	}
	console.error('')
	console.error('This repository does not allow .env* files in the working tree.')
	console.error('See docs/environment-variables.md for the supported delivery mechanisms.')
	process.exit(1)
}
