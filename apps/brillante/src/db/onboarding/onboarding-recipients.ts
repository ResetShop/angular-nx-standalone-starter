import { UserStatus } from '../../contracts/user/user.constants'

/** A user that may need an onboarding email, as read from the database. */
export interface OnboardingCandidate {
	readonly userId: number
	readonly firstName: string
	readonly email: string
	readonly status: UserStatus
	/** True while the user has never chosen a password: imported users start with this flag set. */
	readonly mustChangePassword: boolean
}

export const OnboardingSkipReason = Object.freeze({
	NOT_ACTIVE: 'not-active',
	PLACEHOLDER_EMAIL: 'placeholder-email',
	PASSWORD_ALREADY_SET: 'password-already-set',
	/** `--user-ids` was given and the user is not in the list. */
	NOT_REQUESTED: 'not-requested',
} as const)

export type OnboardingSkipReason = (typeof OnboardingSkipReason)[keyof typeof OnboardingSkipReason]

export interface OnboardingSelection {
	readonly recipients: readonly OnboardingCandidate[]
	readonly skipped: readonly { readonly userId: number; readonly reason: OnboardingSkipReason }[]
}

/** The generated address the import gives users the legacy database stores without an email. Never deliverable. */
export function isPlaceholderEmail(email: string): boolean {
	return /^no-email-\d+@placeholder\.local$/.test(email)
}

function skipReason(
	candidate: OnboardingCandidate,
	requestedIds: ReadonlySet<number> | null,
): OnboardingSkipReason | null {
	if (requestedIds && !requestedIds.has(candidate.userId)) return OnboardingSkipReason.NOT_REQUESTED
	if (candidate.status !== UserStatus.ACTIVE) return OnboardingSkipReason.NOT_ACTIVE
	if (isPlaceholderEmail(candidate.email)) return OnboardingSkipReason.PLACEHOLDER_EMAIL
	if (!candidate.mustChangePassword) return OnboardingSkipReason.PASSWORD_ALREADY_SET
	return null
}

/**
 * Chooses who gets an onboarding email: active users with a real address who have never chosen a password, which
 * leaves out the administrator the seed created (it has a password) and anyone who already finished onboarding, so a
 * re-run only reaches the people still waiting. `requestedUserIds` narrows the choice to the listed users.
 */
export function selectOnboardingRecipients(
	candidates: readonly OnboardingCandidate[],
	requestedUserIds: readonly number[] | null = null,
): OnboardingSelection {
	const requested = requestedUserIds ? new Set(requestedUserIds) : null
	const recipients: OnboardingCandidate[] = []
	const skipped: { userId: number; reason: OnboardingSkipReason }[] = []

	for (const candidate of candidates) {
		const reason = skipReason(candidate, requested)
		if (reason) {
			skipped.push({ userId: candidate.userId, reason })
		} else {
			recipients.push(candidate)
		}
	}
	return { recipients, skipped }
}
