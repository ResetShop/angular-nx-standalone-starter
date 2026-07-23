#!/usr/bin/env node
/**
 * One-time creation of a private mirror of this public starter.
 *
 * GitHub cannot create a private fork of a public repository (fork visibility
 * is immutable), so downstream projects that must stay private use a private
 * mirror instead: a bare clone pushed with `git push --mirror` into a freshly
 * created private repo, plus an `upstream` remote (push URL disabled) pointing
 * at the public starter. Full git history is preserved, so upstream merges stay
 * clean three-way merges — see docs/forking.md "Private mirror setup".
 *
 * Usage (from an existing starter checkout, at the repo root):
 *   npm run fork:init -- --repo=<org>/<name> [--app-name="Display Name"]
 *
 * What it does, in order:
 *   1. Preflight: git/gh available, gh authenticated, target repo absent.
 *   2. Creates the private repo (`gh repo create <org>/<name> --private`).
 *   3. Bare-clones this checkout's `origin` into a temp dir and mirror-pushes
 *      it to the new repo — origin, never the local working tree, so local WIP
 *      branches never leak into the mirror.
 *   4. Clones the mirror into a sibling directory and wires the `upstream`
 *      remote with its push URL disabled.
 *   5. Strips `nxCloudId` from the mirror's nx.json in its own commit — a
 *      private client repo must not report into the public starter's Nx Cloud
 *      workspace.
 *   6. Optionally scaffolds a first app via `npm run generate:app`.
 *
 * Exit codes: 0 = mirror ready, 1 = failed precondition or failed step.
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { buildMirrorRemoteUrls, parseForkInitArgs } from './lib/fork-init.helpers.mjs'

function run(command, options = {}) {
	return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options })
}

function runInherit(command, options = {}) {
	execSync(command, { stdio: 'inherit', ...options })
}

function fail(message) {
	console.error(`FATAL: ${message}`)
	process.exit(1)
}

// Every precondition — including the purely local clone-directory collision —
// is verified here, before any remote side effect: failing after the private
// repo is created and pushed would leave an orphaned, already-populated repo.
function runPreflightChecks(org, name, mirrorDir) {
	assertToolingAvailable()
	assertTargetRepoAbsent(org, name)
	if (existsSync(mirrorDir)) {
		fail(`Target clone directory already exists: ${mirrorDir}`)
	}
}

function assertToolingAvailable() {
	try {
		run('git --version')
	} catch {
		fail('git is not installed or not on PATH')
	}
	try {
		run('gh --version')
	} catch {
		fail('The GitHub CLI (gh) is not installed — see https://cli.github.com')
	}
	try {
		run('gh auth status')
	} catch {
		fail('gh is not authenticated — run `gh auth login` first')
	}
}

function assertTargetRepoAbsent(org, name) {
	try {
		run(`gh repo view ${org}/${name}`)
	} catch (error) {
		const stderr = typeof error.stderr === 'string' ? error.stderr : ''
		// Only a definitive "repository not found" clears the check — any other
		// failure (network, API, auth edge case) must not fall through to
		// `gh repo create` masquerading as "the repo does not exist".
		if (/could not resolve to a repository|http 404|not found/i.test(stderr)) {
			return
		}
		fail(`Could not verify whether ${org}/${name} exists (gh repo view failed):\n${stderr.trim()}`)
	}
	fail(`Repository ${org}/${name} already exists — fork-init only creates brand-new mirrors`)
}

function createPrivateRepo(org, name) {
	console.log(`\n--- Creating private repository ${org}/${name} ---`)
	runInherit(`gh repo create ${org}/${name} --private`)
}

function mirrorPushToNewRepo(mirrorRepoUrl) {
	console.log('\n--- Mirror-pushing the full starter history ---')
	// Bare-clone from origin, never the local working tree — the mirror must
	// contain exactly what the public starter publishes, not local WIP branches.
	const originUrl = run('git remote get-url origin').trim()
	const tempDir = mkdtempSync(join(tmpdir(), 'fork-init-mirror-'))
	const bareDir = join(tempDir, 'mirror.git')
	try {
		runInherit(`git clone --bare ${originUrl} "${bareDir}"`)
		runInherit(`git push --mirror ${mirrorRepoUrl}`, { cwd: bareDir })
	} finally {
		rmSync(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
	}
}

function cloneAndWireRemotes(mirrorRepoUrl, upstreamRepoUrl, mirrorDir) {
	console.log('\n--- Cloning the mirror and wiring remotes ---')
	// Pin core.autocrlf=false for this clone: the repo's blobs are LF and the
	// prettier `check` target demands LF, so a Windows global of autocrlf=true
	// would check out CRLF and fail CI on every file. Linux never converts, so
	// this is inert there and load-bearing only on Windows.
	runInherit(`git clone --config core.autocrlf=false ${mirrorRepoUrl} "${mirrorDir}"`)
	runInherit(`git remote add upstream ${upstreamRepoUrl}`, { cwd: mirrorDir })
	// A disabled push URL makes `git push upstream` fail loudly — the public
	// starter must never receive pushes from a private mirror by accident.
	runInherit('git remote set-url --push upstream DISABLED', { cwd: mirrorDir })
}

function stripNxCloudId(mirrorDir) {
	console.log('\n--- Stripping nxCloudId from the mirror ---')
	const nxJsonPath = join(mirrorDir, 'nx.json')
	const content = readFileSync(nxJsonPath, 'utf8')
	// Surgical single-line removal (not JSON.parse/stringify) so indentation and
	// key order survive and the mirror's divergence is exactly one deleted line.
	const stripped = content.replace(/^\s*"nxCloudId":\s*"[^"]*",?\r?\n/m, '')
	if (stripped === content) {
		console.warn('WARN: no nxCloudId line found in nx.json — nothing to strip')
		return
	}
	writeFileSync(nxJsonPath, stripped)
	runInherit('git add nx.json', { cwd: mirrorDir })
	runInherit('git commit -m "Strip nxCloudId - private mirror uses local Nx cache"', { cwd: mirrorDir })
}

function scaffoldOptionalApp(mirrorDir, appName) {
	if (appName === undefined) {
		return
	}
	console.log(`\n--- Scaffolding "${appName}" via generate:app ---`)
	runInherit('npm install', { cwd: mirrorDir })
	runInherit(`npm run generate:app -- --name="${appName}"`, { cwd: mirrorDir })
	runInherit('git add -A', { cwd: mirrorDir })
	runInherit('git commit -m "Scaffold initial app via generate:app"', { cwd: mirrorDir })
}

function printNextSteps(mirrorDir, appName) {
	console.log('\n--- Private mirror ready ---')
	console.log(`Location: ${mirrorDir}`)
	console.log('')
	console.log('Next steps:')
	if (appName === undefined) {
		console.log('  - npm install, then npm run generate:app -- --name="Your App"')
	}
	console.log('  - Run npm run ci to verify the clean baseline (docs/forking.md "Initial fork setup")')
	console.log('  - Push the local commits: git push origin main')
	console.log('  - Pull upstream updates any time with: npm run upstream:pull')
	console.log('')
	console.log('Notes:')
	console.log('  - nxCloudId was stripped: the mirror uses the local Nx cache, not the starter Nx Cloud workspace.')
	console.log('  - On the GitHub Free org plan, private repos do not enforce rulesets/branch protection and')
	console.log('    GitHub Actions minutes are metered — review your merge-gate and CI expectations.')
}

function main() {
	let args
	try {
		args = parseForkInitArgs(process.argv.slice(2))
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error))
	}
	const { org, name, appName } = args
	const { mirrorRepoUrl, upstreamRepoUrl } = buildMirrorRemoteUrls(org, name)
	const mirrorDir = resolve(process.cwd(), '..', name)
	runPreflightChecks(org, name, mirrorDir)
	createPrivateRepo(org, name)
	mirrorPushToNewRepo(mirrorRepoUrl)
	cloneAndWireRemotes(mirrorRepoUrl, upstreamRepoUrl, mirrorDir)
	stripNxCloudId(mirrorDir)
	scaffoldOptionalApp(mirrorDir, appName)
	printNextSteps(mirrorDir, appName)
}

try {
	main()
} catch (error) {
	fail(error instanceof Error ? error.message : String(error))
}
