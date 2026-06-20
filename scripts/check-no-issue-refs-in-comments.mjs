#!/usr/bin/env node
/**
 * Fails if any TypeScript source file under `apps/` or `packages/` contains a
 * GitHub issue/PR number token (`#NNN`) inside a code comment.
 *
 * The repo's contract (see CLAUDE.md — "Code Comment Quality" and
 * `.claude/references/coding-agent-policies.md` Section 6):
 *   - Code comments describe present-state intent and rationale — what the code
 *     does and why it must be this way now — never the history of how it got here.
 *   - No issue/PR number references and no before/after-issue framing in comments.
 *     The migration record belongs in `CHANGELOG.md` and the PR; the "when/who"
 *     belongs in `git log` / `git blame`.
 *
 * Why both layers (pre-commit AND CI), mirroring `check-no-env-files.mjs`:
 *   - Pre-commit catches the comment the moment someone tries to commit it.
 *   - CI catches the case where the hook was bypassed (`--no-verify`) or the
 *     token slipped in through a rebase, manual git op, or agent misbehavior.
 *
 * What is scanned: `.ts` files under `apps/` and `packages/` (including
 *   `.spec.ts` and `.stories.ts`). `CHANGELOG.md`, `docs/`, `README.md`, and
 *   `.claude/` are not `.ts` files and are therefore exempt by path, where
 *   hyperlinked issue references are a legitimate durable cross-reference.
 * What is skipped: `node_modules/`, `dist/`, `.nx/`.
 * Pattern flagged: a `//` line comment or a block-comment `*` continuation line
 *   that contains `#` followed by a digit 1-9 and at least two more digits
 *   (`#[1-9]\d{2,}`). The leading 1-9 and the `//`/`*` comment context together
 *   keep CSS hex literals (which live in template strings, not comments) clear.
 *
 * Exit codes: 0 = clean, 1 = issue reference found.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))

const SEARCH_ROOTS = [join(REPO_ROOT, 'apps'), join(REPO_ROOT, 'packages')]

const SKIP_DIRS = new Set(['node_modules', 'dist', '.nx'])

const ISSUE_REF_IN_COMMENT = /(?:\/\/|^\s*\*)\s.*#[1-9]\d{2,}/

function collectTsFiles(dir) {
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
			if (!SKIP_DIRS.has(name)) {
				found.push(...collectTsFiles(fullPath))
			}
			continue
		}
		if (name.endsWith('.ts')) {
			found.push(fullPath)
		}
	}
	return found
}

const offenders = []
for (const root of SEARCH_ROOTS) {
	for (const file of collectTsFiles(root)) {
		const lines = readFileSync(file, 'utf8').split('\n')
		for (let i = 0; i < lines.length; i++) {
			if (ISSUE_REF_IN_COMMENT.test(lines[i])) {
				offenders.push({ file, line: i + 1, text: lines[i].trim() })
			}
		}
	}
}

if (offenders.length > 0) {
	console.error('FATAL: issue/PR number reference(s) found in code comments:')
	for (const { file, line, text } of offenders) {
		console.error(`  ${relative(REPO_ROOT, file)}:${line}`)
		console.error(`    ${text}`)
	}
	console.error('')
	console.error('Code comments must describe present-state rationale only — no issue/PR numbers.')
	console.error('See CLAUDE.md "Code Comment Quality" and .claude/references/coding-agent-policies.md Section 6.')
	process.exit(1)
}
