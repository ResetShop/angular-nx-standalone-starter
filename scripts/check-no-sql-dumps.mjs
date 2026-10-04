#!/usr/bin/env node
/**
 * Fails if a database dump (`*.sql`, `*.dump`, `*.dmp`, `*.bak`, `*.sql.gz|zip|bz2|xz|7z`) is tracked or sits untracked
 * and not ignored anywhere in the working tree, except the Drizzle migrations under `drizzle/` at the repository root.
 * Compressed or renamed dumps beyond these extensions are not detected: the check is a safety net, not a scanner.
 *
 * Dumps such as the legacy Brillante export are real personal data and stay on the operator's machine. Keep a
 * local copy outside the repository, or inside it under an ignored name (`*.dump.sql`) or directory
 * (`legacy-dumps/`); git ignores those, so this check does not see them.
 *
 * Runs from the pre-commit hook and from the `check` Nx target (part of `npm run ci` / `ci:verify`).
 *
 * Exit codes: 0 = clean, 1 = forbidden file found.
 */
import { execFileSync } from 'node:child_process'
import { findForbiddenDumpFiles } from './lib/sql-dump-guard.helpers.mjs'

let listing
try {
	listing = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
} catch (error) {
	console.error('FATAL: could not list the repository files with git; run this check from inside the working tree.')
	console.error(String(error.message).split('\n')[0])
	process.exit(2)
}
const offenders = findForbiddenDumpFiles(listing.split('\0').filter(Boolean))

if (offenders.length > 0) {
	console.error('FATAL: database dump file(s) detected that git does not ignore:')
	for (const path of offenders) {
		console.error(`  - ${path}`)
	}
	console.error('')
	console.error('Dumps hold real data and must not be committed. Keep them outside the repository, or name them')
	console.error('`*.dump.sql` / place them under `legacy-dumps/`, which .gitignore covers.')
	process.exit(1)
}
