import {
	buildConflictGuidance,
	detectChangelogWarnings,
	isLockfileOnlyConflict,
	parseUpstreamPullArgs,
} from './upstream-pull.helpers.mjs'

describe('parseUpstreamPullArgs', () => {
	it('returns skipConfirmation false without --yes', () => {
		expect(parseUpstreamPullArgs([])).toEqual({ skipConfirmation: false })
	})

	it('returns skipConfirmation true with --yes', () => {
		expect(parseUpstreamPullArgs(['--yes'])).toEqual({ skipConfirmation: true })
	})
})

describe('detectChangelogWarnings', () => {
	it('detects an added "### Removed" heading', () => {
		const diff = '+### Removed\n+\n+- **Old API deleted.**'
		expect(detectChangelogWarnings(diff)).toEqual({
			hasRemovedSection: true,
			hasBreakingMention: false,
			hasMigrationMention: false,
			hasAny: true,
		})
	})

	it('detects a "breaking" mention case-insensitively', () => {
		const diff = '+- **Renamed the auth token API — BREAKING for forks.**'
		const warnings = detectChangelogWarnings(diff)
		expect(warnings.hasBreakingMention).toBe(true)
		expect(warnings.hasAny).toBe(true)
	})

	it('detects a "migration" mention case-insensitively', () => {
		const diff = '+- **New env schema. Migration: rename PASETO_KEY.**'
		const warnings = detectChangelogWarnings(diff)
		expect(warnings.hasMigrationMention).toBe(true)
		expect(warnings.hasAny).toBe(true)
	})

	it('returns no warnings for an additive-only delta', () => {
		const diff = '+### Added\n+\n+- **New helper script for formatting.**'
		expect(detectChangelogWarnings(diff)).toEqual({
			hasRemovedSection: false,
			hasBreakingMention: false,
			hasMigrationMention: false,
			hasAny: false,
		})
	})

	it('ignores markers on context and removed lines', () => {
		const diff = [
			' ### Removed',
			' - old context entry mentioning a breaking change',
			'-- removed line with migration notes',
			'+++ b/CHANGELOG.md',
			'+- harmless added entry',
		].join('\n')
		expect(detectChangelogWarnings(diff).hasAny).toBe(false)
	})

	it('pauses on a release section that has a Fork migration checklist', () => {
		const diff = [
			'+## [1.2.0] — 2026-11-02',
			'+',
			'+Version 1.2.0 adds passkeys. Read **Fork migration** below before merging.',
			'+',
			'+### Fork migration',
			'+',
			'+- [#700] - Add the `PASSKEYS` keys to your own language files.',
		].join('\n')
		const warnings = detectChangelogWarnings(diff)
		expect(warnings.hasMigrationMention).toBe(true)
		expect(warnings.hasAny).toBe(true)
	})

	it('pauses on a Fork migration heading on its own', () => {
		const warnings = detectChangelogWarnings('+### Fork migration')
		expect(warnings.hasMigrationMention).toBe(true)
		expect(warnings.hasAny).toBe(true)
	})

	// A release with nothing for forks to do omits the Fork migration heading and must not pause
	// the merge: a pause that fires on every release teaches forks to skip it.
	it('does not pause on a release section with no fork action', () => {
		const diff = [
			'+## [1.1.1] — 2026-10-15',
			'+',
			'+Version 1.1.1 changes how releases are documented. No fork action is needed.',
			'+',
			'+### Full changes',
			'+',
			'+See every merged pull request in [v1.1.1](https://github.com/ResetShop/angular-nx-standalone-starter/releases/tag/v1.1.1).',
			'+',
			'+### Changes',
			'+',
			'+#### Release process',
			'+',
			'+- [#615] - Writes the release notes at release time.',
			'+',
			'+[#615]: https://github.com/ResetShop/angular-nx-standalone-starter/issues/615',
		].join('\n')
		expect(detectChangelogWarnings(diff)).toEqual({
			hasRemovedSection: false,
			hasBreakingMention: false,
			hasMigrationMention: false,
			hasAny: false,
		})
	})
})

describe('isLockfileOnlyConflict', () => {
	it('is true for exactly [package-lock.json]', () => {
		expect(isLockfileOnlyConflict(['package-lock.json'])).toBe(true)
	})

	it('is false when another file conflicts alongside the lockfile', () => {
		expect(isLockfileOnlyConflict(['package-lock.json', 'package.json'])).toBe(false)
	})

	it('is false for an empty conflict set', () => {
		expect(isLockfileOnlyConflict([])).toBe(false)
	})

	it('is false for a single non-lockfile conflict', () => {
		expect(isLockfileOnlyConflict(['package.json'])).toBe(false)
	})
})

describe('buildConflictGuidance', () => {
	it('gives package.json the union-both-sides guidance', () => {
		expect(buildConflictGuidance(['package.json'])).toContain('union both sides')
	})

	it('gives package-lock.json the delete-and-regenerate guidance', () => {
		expect(buildConflictGuidance(['package-lock.json'])).toContain('delete and regenerate')
	})

	it('gives tsconfig.base.json the alias-block guidance', () => {
		expect(buildConflictGuidance(['tsconfig.base.json'])).toContain('alias block')
	})

	it('gives nx.json and eslint.config.mjs the accept-upstream guidance', () => {
		expect(buildConflictGuidance(['nx.json'])).toContain('accept the upstream change')
		expect(buildConflictGuidance(['eslint.config.mjs'])).toContain('accept the upstream change')
	})

	it('falls back to generic guidance for unknown files', () => {
		expect(buildConflictGuidance(['apps/my-app/src/main.ts'])).toContain('resolve manually')
	})

	it('emits one line per conflicted file', () => {
		const guidance = buildConflictGuidance(['package.json', 'nx.json', 'other.ts'])
		expect(guidance.split('\n')).toHaveLength(3)
	})

	it('renders the lockfile guidance alongside other files when it is not the sole conflict', () => {
		const guidance = buildConflictGuidance(['package-lock.json', 'nx.json'])
		expect(guidance).toContain('package-lock.json: delete and regenerate')
		expect(guidance).toContain('nx.json: accept the upstream change')
		expect(guidance.split('\n')).toHaveLength(2)
	})
})
