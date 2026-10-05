import { buildPasswordResetUrl } from '../../api/modules/auth/reset-token'
import type { EmailContent } from '../../api/services/email/email-builder.utils'
import { buildOnboardingEmail } from '../../api/services/email/onboarding-email.builder'
import { SafeImportError } from '../legacy-import/safe-import-error'
import { type OnboardingCandidate, type OnboardingSelection, selectOnboardingRecipients } from './onboarding-recipients'

/** What the onboarding needs from the database. */
export interface OnboardingTarget {
	readCandidates(): Promise<readonly OnboardingCandidate[]>
	/**
	 * Replaces the user's outstanding reset tokens with a new one that expires at `expiresAt` and returns the raw
	 * token, which exists nowhere else.
	 */
	issueResetToken(userId: number, expiresAt: Date): Promise<string>
}

/** Delivers one email. Implemented over the app's email service, so it uses whichever provider is configured. */
export interface OnboardingMailer {
	send(to: string, content: EmailContent): Promise<void>
}

export interface OnboardingOptions {
	/** Preview only: select the recipients and report, but issue no token and send nothing. */
	readonly dryRun: boolean
	readonly requestedUserIds: readonly number[] | null
	/** Lifetime of the reset links, as a duration in milliseconds, resolved by the caller from the constant. */
	readonly tokenLifetimeMs: number
	/** Pause between two emails, so a bulk send does not trip provider rate limits. */
	readonly pauseBetweenSendsMs: number
	/** Called with the selection before anything is sent, also on a dry run; throw to refuse the run. */
	readonly precheck?: (selection: OnboardingSelection) => void
	readonly now?: () => Date
	readonly pause?: (milliseconds: number) => Promise<void>
}

export interface OnboardingResult {
	readonly selection: OnboardingSelection
	readonly sentUserIds: readonly number[]
	readonly failedUserIds: readonly number[]
	/** Counts and user ids only. */
	readonly report: string
}

function formatReport(
	selection: OnboardingSelection,
	sent: readonly number[],
	failed: readonly number[],
	dryRun: boolean,
): string {
	const skippedByReason = new Map<string, number[]>()
	for (const { userId, reason } of selection.skipped) {
		skippedByReason.set(reason, [...(skippedByReason.get(reason) ?? []), userId])
	}
	const skippedLines = [...skippedByReason]
		.sort()
		.map(([reason, ids]) => `  ${reason}: ${ids.length} (user ids ${ids.join(', ')})`)

	return [
		`Recipients: ${selection.recipients.length} (user ids ${selection.recipients.map((r) => r.userId).join(', ') || 'none'})`,
		skippedLines.length > 0 ? ['Skipped:', ...skippedLines].join('\n') : 'Skipped: none',
		dryRun ? 'Sent: none (dry run)' : `Sent: ${sent.length}`,
		dryRun ? '' : `Failed: ${failed.length}${failed.length > 0 ? ` (user ids ${failed.join(', ')})` : ''}`,
	]
		.filter((line) => line !== '')
		.join('\n')
}

async function sendTo(
	candidate: OnboardingCandidate,
	target: OnboardingTarget,
	mailer: OnboardingMailer,
	expiresAt: Date,
): Promise<void> {
	const token = await target.issueResetToken(candidate.userId, expiresAt)
	const content = buildOnboardingEmail({ firstName: candidate.firstName, resetUrl: buildPasswordResetUrl(token) })
	await mailer.send(candidate.email, content)
}

/**
 * Sends each recipient an email with a single-use link to choose a password. Every recipient gets a fresh token that
 * replaces the previous one, so running it again only reaches users who still have not chosen a password and
 * invalidates the older links. One failure does not stop the others: it is counted and its user id reported (never the
 * address or the provider's message, which can contain it). A dry run selects and reports without touching anything.
 */
export async function runOnboarding(
	target: OnboardingTarget,
	mailer: OnboardingMailer,
	options: OnboardingOptions,
): Promise<OnboardingResult> {
	const now = options.now ?? (() => new Date())
	const pause = options.pause ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
	const selection = selectOnboardingRecipients(await target.readCandidates(), options.requestedUserIds)
	const missing = (options.requestedUserIds ?? []).filter(
		(id) => !selection.recipients.some((r) => r.userId === id) && !selection.skipped.some((s) => s.userId === id),
	)
	if (missing.length > 0) {
		throw new SafeImportError(`--user-ids names user id(s) ${missing.join(', ')} that do not exist.`)
	}

	options.precheck?.(selection)

	const sent: number[] = []
	const failed: number[] = []
	if (!options.dryRun) {
		for (const [index, candidate] of selection.recipients.entries()) {
			if (index > 0) await pause(options.pauseBetweenSendsMs)
			try {
				await sendTo(candidate, target, mailer, new Date(now().getTime() + options.tokenLifetimeMs))
				sent.push(candidate.userId)
			} catch {
				failed.push(candidate.userId)
			}
		}
	}

	return {
		selection,
		sentUserIds: sent,
		failedUserIds: failed,
		report: formatReport(selection, sent, failed, options.dryRun),
	}
}
