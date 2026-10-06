import { UserStatus } from '../../contracts/user/user.constants'
import { assertEtherealRecipientsAreFake, assertProviderDelivers } from './fake-address-guard'
import type { OnboardingCandidate } from './onboarding-recipients'

function recipient(userId: number, email: string): OnboardingCandidate {
	return { userId, firstName: 'Ana', email, status: UserStatus.ACTIVE, mustChangePassword: true }
}

describe('assertEtherealRecipientsAreFake', () => {
	it.each([
		'a@example.test',
		'b@brillante.example',
		'c@host.invalid',
		'd@x.localhost',
		'e@example.com',
		'f@EXAMPLE.ORG',
	])('allows the reserved address %s', (email) => {
		expect(() => assertEtherealRecipientsAreFake('ethereal', [recipient(2, email)])).not.toThrow()
	})

	it('refuses real addresses and names only their user ids, never the addresses', () => {
		const attempt = () =>
			assertEtherealRecipientsAreFake('ethereal', [
				recipient(2, 'fake@example.test'),
				recipient(3, 'someone@gmail.com'),
				recipient(4, 'owner@brillantestore.com'),
			])

		expect(attempt).toThrow(/2 recipient\(s\) \(user ids 3, 4\)/)
		expect(attempt).toThrow(/third-party server/)
		expect(() => attempt()).not.toThrow(/gmail|brillantestore/)
	})

	it('does not look at the recipients for any other provider', () => {
		expect(() => assertEtherealRecipientsAreFake('nodemailer', [recipient(3, 'someone@gmail.com')])).not.toThrow()
		expect(() => assertEtherealRecipientsAreFake('noop', [recipient(3, 'someone@gmail.com')])).not.toThrow()
	})

	it('allows an empty list', () => {
		expect(() => assertEtherealRecipientsAreFake('ethereal', [])).not.toThrow()
	})

	it('does not treat a domain that merely contains a reserved word as reserved', () => {
		expect(() => assertEtherealRecipientsAreFake('ethereal', [recipient(2, 'x@notexample.com')])).toThrow()
		expect(() => assertEtherealRecipientsAreFake('ethereal', [recipient(2, 'x@test.com')])).toThrow()
	})
})

describe('assertProviderDelivers', () => {
	it('refuses to apply with the noop provider when somebody would be mailed', () => {
		expect(() => assertProviderDelivers('noop', false, [recipient(2, 'a@example.test')])).toThrow(/nobody receives/)
	})

	it('refuses to apply with the cloudflare provider, which a Node script cannot reach', () => {
		expect(() => assertProviderDelivers('cloudflare', false, [recipient(2, 'a@example.test')])).toThrow(
			/only works inside the Worker/,
		)
	})

	it.each([
		['a dry run', 'noop', true, [recipient(2, 'a@example.test')]],
		['no recipients', 'noop', false, []],
		['another provider', 'nodemailer', false, [recipient(2, 'a@example.test')]],
	] as const)('allows %s', (_label, provider, dryRun, recipients) => {
		expect(() => assertProviderDelivers(provider, dryRun, recipients)).not.toThrow()
	})
})
