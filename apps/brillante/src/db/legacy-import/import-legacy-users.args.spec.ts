import { parseImportLegacyUsersArgs } from './import-legacy-users.args'

describe('parseImportLegacyUsersArgs', () => {
	it('is a dry run by default: nothing is written without --apply', () => {
		expect(parseImportLegacyUsersArgs(['--dump', 'users.dump.sql'])).toEqual({
			dumpPath: 'users.dump.sql',
			dryRun: true,
			alreadyProvisionedLegacyUserIds: [],
			reportPath: null,
		})
	})

	it('writes only with --apply', () => {
		expect(parseImportLegacyUsersArgs(['--dump', 'x', '--apply']).dryRun).toBe(false)
	})

	it('accepts --dry-run as the explicit spelling of the default', () => {
		expect(parseImportLegacyUsersArgs(['--dump', 'x', '--dry-run']).dryRun).toBe(true)
	})

	it('rejects --dry-run together with --apply', () => {
		expect(() => parseImportLegacyUsersArgs(['--dump', 'x', '--dry-run', '--apply'])).toThrow(/cannot be combined/)
	})

	it('reads the provisioned ids and the report path', () => {
		const args = parseImportLegacyUsersArgs([
			'--dump',
			'users.dump.sql',
			'--already-provisioned',
			'1, 3',
			'--report',
			'report.txt',
		])

		expect(args).toEqual({
			dumpPath: 'users.dump.sql',
			dryRun: true,
			alreadyProvisionedLegacyUserIds: [1, 3],
			reportPath: 'report.txt',
		})
	})

	it('requires the dump path: there is no default location for personal data', () => {
		expect(() => parseImportLegacyUsersArgs(['--apply'])).toThrow(/--dump is required/)
	})

	it.each([['--dump'], ['--dump', '--apply'], ['--dump', 'x', '--report']])('rejects %j without a value', (...argv) => {
		expect(() => parseImportLegacyUsersArgs(argv)).toThrow(/needs a value/)
	})

	it.each(['0', '-1', 'a', '1,,2', '1.5', '1e1', '0x10', '01'])('rejects the provisioned ids %j', (ids) => {
		expect(() => parseImportLegacyUsersArgs(['--dump', 'x', '--already-provisioned', ids])).toThrow(
			/positive integer ids/,
		)
	})

	it('removes repeated provisioned ids', () => {
		expect(
			parseImportLegacyUsersArgs(['--dump', 'x', '--already-provisioned', '1,1,2']).alreadyProvisionedLegacyUserIds,
		).toEqual([1, 2])
	})

	it.each(['--dryrun', '-dry-run', '—dry-run', 'dry-run', '--force'])(
		'rejects the unknown option or stray argument %s instead of ignoring it',
		(token) => {
			expect(() => parseImportLegacyUsersArgs(['--dump', 'x', token])).toThrow(/Unknown option or stray argument/)
		},
	)
})
