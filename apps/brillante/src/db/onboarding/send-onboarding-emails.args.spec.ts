import { parseSendOnboardingEmailsArgs } from './send-onboarding-emails.args'

describe('parseSendOnboardingEmailsArgs', () => {
	it('is a dry run for everybody by default: nothing is sent without --apply', () => {
		expect(parseSendOnboardingEmailsArgs([])).toEqual({ dryRun: true, userIds: null })
	})

	it('sends only with --apply', () => {
		expect(parseSendOnboardingEmailsArgs(['--apply']).dryRun).toBe(false)
	})

	it('accepts --dry-run as the explicit spelling of the default', () => {
		expect(parseSendOnboardingEmailsArgs(['--dry-run']).dryRun).toBe(true)
	})

	it('rejects --dry-run together with --apply', () => {
		expect(() => parseSendOnboardingEmailsArgs(['--dry-run', '--apply'])).toThrow(/cannot be combined/)
	})

	it('reads and de-duplicates the user ids', () => {
		expect(parseSendOnboardingEmailsArgs(['--user-ids', '2, 3,3']).userIds).toEqual([2, 3])
	})

	it.each(['0', '-1', 'a', '1,,2', '1.5', '1e1', '0x10', '01'])('rejects the user ids %j', (ids) => {
		expect(() => parseSendOnboardingEmailsArgs(['--user-ids', ids])).toThrow(/positive integer ids/)
	})

	it.each([[['--user-ids']], [['--user-ids', '--apply']]])('rejects --user-ids without a value: %j', (argv) => {
		expect(() => parseSendOnboardingEmailsArgs(argv)).toThrow(/needs a value/)
	})

	it.each(['--aply', '-apply', '—apply', 'apply', '--force'])(
		'rejects the unknown option or stray argument %s instead of ignoring it',
		(token) => {
			expect(() => parseSendOnboardingEmailsArgs([token])).toThrow(/Unknown option or stray argument/)
		},
	)
})
