import { parseImportLegacyUsersArgs } from './import-legacy-users.args'

describe('parseImportLegacyUsersArgs', () => {
	it('reads the dump path and defaults to a real run without provisioned users or a report file', () => {
		expect(parseImportLegacyUsersArgs(['--dump', 'users.dump.sql'])).toEqual({
			dumpPath: 'users.dump.sql',
			dryRun: false,
			alreadyProvisionedLegacyUserIds: [],
			reportPath: null,
		})
	})

	it('reads the dry-run flag, the provisioned ids and the report path', () => {
		const args = parseImportLegacyUsersArgs([
			'--dump',
			'users.dump.sql',
			'--dry-run',
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
		expect(() => parseImportLegacyUsersArgs(['--dry-run'])).toThrow(/--dump is required/)
	})

	it.each([['--dump'], ['--dump', '--dry-run'], ['--dump', 'x', '--report']])(
		'rejects %j without a value',
		(...argv) => {
			expect(() => parseImportLegacyUsersArgs(argv)).toThrow(/needs a value|--dump is required/)
		},
	)

	it.each(['0', '-1', 'a', '1,,2', '1.5'])('rejects the provisioned ids %j', (ids) => {
		expect(() => parseImportLegacyUsersArgs(['--dump', 'x', '--already-provisioned', ids])).toThrow(
			/positive integer ids/,
		)
	})

	it('rejects an unknown option instead of ignoring a typo such as --dryrun', () => {
		expect(() => parseImportLegacyUsersArgs(['--dump', 'x', '--dryrun'])).toThrow(/Unknown option --dryrun/)
	})
})
