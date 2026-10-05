import { SafeImportError } from '../legacy-import/safe-import-error'
import type { OnboardingCandidate } from './onboarding-recipients'

/** Domains and suffixes reserved for documentation and tests (RFC 2606 and RFC 6761): they never reach a person. */
function isReservedAddress(email: string): boolean {
	const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase()
	return (
		/\.(test|example|invalid|localhost)$/.test(domain) || ['example.com', 'example.org', 'example.net'].includes(domain)
	)
}

/**
 * Ethereal is a public test service: it delivers nothing, and every message it receives (the address, the name, a
 * working reset link) is stored on a third party's server. Sending real users' emails through it would leak their
 * data and their reset links without notifying anyone, so with the Ethereal provider the send is refused unless every
 * recipient has a reserved test address.
 */
export function assertEtherealRecipientsAreFake(provider: string, recipients: readonly OnboardingCandidate[]): void {
	if (provider !== 'ethereal') return
	const real = recipients.filter((recipient) => !isReservedAddress(recipient.email))
	if (real.length > 0) {
		throw new SafeImportError(
			`Refusing to send through Ethereal: ${real.length} recipient(s) (user ids ${real.map((r) => r.userId).join(', ')}) ` +
				'do not have a reserved test address. Ethereal stores every message it receives on a third-party server.',
		)
	}
}
