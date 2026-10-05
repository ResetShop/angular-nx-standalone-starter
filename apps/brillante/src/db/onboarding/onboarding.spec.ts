import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { seedAppEnv } from '../../api/config/app.env'
import { seedHttpEnv } from '../../api/config/http.env'
import type { EmailContent } from '../../api/services/email/email-builder.utils'
import { UserStatus } from '../../contracts/user/user.constants'
import { type OnboardingMailer, type OnboardingTarget, runOnboarding } from './onboarding'
import type { OnboardingCandidate } from './onboarding-recipients'

function candidate(userId: number, overrides: Partial<OnboardingCandidate> = {}): OnboardingCandidate {
	return {
		userId,
		firstName: 'Ana',
		email: `user${userId}@example.test`,
		status: UserStatus.ACTIVE,
		mustChangePassword: true,
		...overrides,
	}
}

describe('runOnboarding', () => {
	let issueResetToken: MockFn<[number, Date], Promise<string>>
	let send: MockFn<[string, EmailContent], Promise<void>>
	let pause: MockFn<[number], Promise<void>>

	const NOW = new Date('2026-10-05T12:00:00.000Z')
	const DAY = 24 * 60 * 60 * 1000

	function targetOf(candidates: OnboardingCandidate[]): OnboardingTarget {
		return { readCandidates: async () => candidates, issueResetToken }
	}

	function run(
		candidates: OnboardingCandidate[],
		overrides: { dryRun?: boolean; requestedUserIds?: number[] | null } = {},
	) {
		const mailer: OnboardingMailer = { send }
		return runOnboarding(targetOf(candidates), mailer, {
			dryRun: overrides.dryRun ?? false,
			requestedUserIds: overrides.requestedUserIds ?? null,
			tokenLifetimeMs: DAY,
			pauseBetweenSendsMs: 500,
			now: () => NOW,
			pause,
		})
	}

	beforeEach(() => {
		clearAllMocks()
		seedAppEnv()
		seedHttpEnv({ CORS_ORIGIN: 'https://app.test' })
		issueResetToken = fn<[number, Date], Promise<string>>()
		issueResetToken.mockImplementation(async (userId) => `token-${userId}`)
		send = fn<[string, EmailContent], Promise<void>>()
		send.mockResolvedValue(undefined)
		pause = fn<[number], Promise<void>>()
		pause.mockResolvedValue(undefined)
	})

	it('issues a token valid for one day and mails the link to each recipient', async () => {
		const result = await run([candidate(2), candidate(3)])

		expect(result.sentUserIds).toEqual([2, 3])
		expect(issueResetToken.calls[0]).toEqual([2, new Date(NOW.getTime() + DAY)])
		expect(send.calls.map((call) => call[0])).toEqual(['user2@example.test', 'user3@example.test'])
		expect(send.calls[0][1].text).toContain('https://app.test/auth/reset-password/confirm?token=token-2')
	})

	it('does not mail users who are skipped', async () => {
		const result = await run([
			candidate(1, { mustChangePassword: false }),
			candidate(2),
			candidate(3, { status: UserStatus.DISABLED }),
		])

		expect(send.calls.map((call) => call[0])).toEqual(['user2@example.test'])
		expect(result.report).toContain('password-already-set: 1 (user ids 1)')
		expect(result.report).toContain('not-active: 1 (user ids 3)')
	})

	it('issues no token and sends nothing on a dry run, but reports who would be mailed', async () => {
		const result = await run([candidate(2), candidate(3)], { dryRun: true })

		expect(issueResetToken.calls).toHaveLength(0)
		expect(send.calls).toHaveLength(0)
		expect(result.report).toContain('Recipients: 2 (user ids 2, 3)')
		expect(result.report).toContain('Sent: none (dry run)')
	})

	it('pauses between the emails but not before the first one', async () => {
		await run([candidate(2), candidate(3), candidate(4)])

		expect(pause.calls).toEqual([[500], [500]])
	})

	it('keeps going after a failure and reports the user id, never the address or the provider message', async () => {
		send.mockImplementation(async (to) => {
			if (to === 'user3@example.test') throw new Error('550 user3@example.test mailbox unavailable')
		})

		const result = await run([candidate(2), candidate(3), candidate(4)])

		expect(result.sentUserIds).toEqual([2, 4])
		expect(result.failedUserIds).toEqual([3])
		expect(result.report).toContain('Failed: 1 (user ids 3)')
		expect(result.report).not.toMatch(/example\.test|mailbox/)
	})

	it('runs the precheck with the selection, also on a dry run, and stops before sending when it throws', async () => {
		const mailer: OnboardingMailer = { send }
		const attempt = runOnboarding(targetOf([candidate(2)]), mailer, {
			dryRun: false,
			requestedUserIds: null,
			tokenLifetimeMs: DAY,
			pauseBetweenSendsMs: 0,
			precheck: () => {
				throw new Error('refused')
			},
		})

		await expect(attempt).rejects.toThrow('refused')
		expect(issueResetToken.calls).toHaveLength(0)
		expect(send.calls).toHaveLength(0)
	})

	it('rejects a requested user id that does not exist instead of silently ignoring it', async () => {
		await expect(run([candidate(2)], { requestedUserIds: [2, 99] })).rejects.toThrow(
			/user id\(s\) 99 that do not exist/,
		)
		expect(send.calls).toHaveLength(0)
	})

	it('never puts names or emails in the report', async () => {
		const result = await run([candidate(2), candidate(3, { status: UserStatus.DISABLED })])

		expect(result.report).not.toMatch(/example\.test|Ana/)
	})

	it('has nothing to do when nobody is waiting for a password', async () => {
		const result = await run([candidate(1, { mustChangePassword: false })])

		expect(result.sentUserIds).toEqual([])
		expect(result.report).toContain('Recipients: 0 (user ids none)')
	})
})
