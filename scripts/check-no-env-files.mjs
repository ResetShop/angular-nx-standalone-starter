/**
 * CI / pre-commit guard: fails when any `.env*` file exists in the working
 * tree root.
 *
 * The repo's policy is that environment variables are delivered via
 * out-of-tree mechanisms (see docs/environment-variables.md). A `.env` file
 * in the working tree is a structural risk: AI coding agents opportunistically
 * scan project roots for these files and may read or modify them without
 * authorization.
 *
 * Run via `npm run ci` (CI backstop) and `.husky/pre-commit` (local
 * defense-in-depth). Scanning the root only — this is where agents look first
 * and where the threat is highest.
 */
import { readdirSync } from 'node:fs'

const offenders = readdirSync('.').filter((name) => name === '.env' || name.startsWith('.env.'))

if (offenders.length > 0) {
	console.error('Policy violation: .env* file(s) detected in the working tree root:')
	for (const name of offenders) {
		console.error(`  ./${name}`)
	}
	console.error('')
	console.error('The repo policy is no .env files in the working tree.')
	console.error('See docs/environment-variables.md for the four supported delivery options.')
	process.exit(1)
}
