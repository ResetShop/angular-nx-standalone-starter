import { UserStatus } from '../../contracts/user/user.constants'
import {
	isPlaceholderEmail,
	type OnboardingCandidate,
	OnboardingSkipReason,
	selectOnboardingRecipients,
} from './onboarding-recipients'

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

describe('isPlaceholderEmail', () => {
	it('recognises the address the import generates for users without an email', () => {
		expect(isPlaceholderEmail('no-email-7@placeholder.local')).toBe(true)
	})

	it.each([
		'no-email-@placeholder.local',
		'no-email-7@placeholder.com',
		'a@placeholder.local',
		'no-email-7@placeholder.local.x',
	])('does not treat %s as a placeholder', (email) => {
		expect(isPlaceholderEmail(email)).toBe(false)
	})
})

describe('selectOnboardingRecipients', () => {
	it('selects active users with a real address who have not chosen a password', () => {
		const { recipients, skipped } = selectOnboardingRecipients([candidate(2), candidate(3)])

		expect(recipients.map((r) => r.userId)).toEqual([2, 3])
		expect(skipped).toEqual([])
	})

	it('leaves out the administrator the seed created, who already has a password', () => {
		const { recipients, skipped } = selectOnboardingRecipients([
			candidate(1, { mustChangePassword: false }),
			candidate(2),
		])

		expect(recipients.map((r) => r.userId)).toEqual([2])
		expect(skipped).toEqual([{ userId: 1, reason: OnboardingSkipReason.PASSWORD_ALREADY_SET }])
	})

	it('skips disabled and deleted users', () => {
		const { skipped } = selectOnboardingRecipients([
			candidate(2, { status: UserStatus.DISABLED }),
			candidate(3, { status: UserStatus.DELETED }),
		])

		expect(skipped).toEqual([
			{ userId: 2, reason: OnboardingSkipReason.NOT_ACTIVE },
			{ userId: 3, reason: OnboardingSkipReason.NOT_ACTIVE },
		])
	})

	it('skips users whose address is the generated placeholder, even when they are active', () => {
		const { recipients, skipped } = selectOnboardingRecipients([
			candidate(2, { email: 'no-email-2@placeholder.local' }),
		])

		expect(recipients).toEqual([])
		expect(skipped).toEqual([{ userId: 2, reason: OnboardingSkipReason.PLACEHOLDER_EMAIL }])
	})

	it('narrows the selection to the requested ids and explains the others', () => {
		const { recipients, skipped } = selectOnboardingRecipients([candidate(2), candidate(3)], [3])

		expect(recipients.map((r) => r.userId)).toEqual([3])
		expect(skipped).toEqual([{ userId: 2, reason: OnboardingSkipReason.NOT_REQUESTED }])
	})

	it('still applies the other rules to a requested id', () => {
		const { recipients, skipped } = selectOnboardingRecipients([candidate(2, { status: UserStatus.DISABLED })], [2])

		expect(recipients).toEqual([])
		expect(skipped).toEqual([{ userId: 2, reason: OnboardingSkipReason.NOT_ACTIVE }])
	})
})
