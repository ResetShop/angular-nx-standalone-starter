import { clearAllMocks } from '@resetshop/util/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { seedAppEnv } from '../../config/app.env'
import { ONBOARDING_RESET_TOKEN_EXPIRY } from '../../constants/auth.constants'
import { buildOnboardingEmail } from './onboarding-email.builder'

describe('buildOnboardingEmail', () => {
	const params = {
		firstName: 'Ada',
		resetUrl: 'https://app.test/auth/reset-password/confirm?token=raw-token-abc',
	}

	beforeEach(() => {
		clearAllMocks()
		// Seed the app env cache to its defaults (APP_LANGUAGE='en'), bypassing process.env.
		seedAppEnv()
	})

	it('defaults to English when no language is passed', () => {
		expect(buildOnboardingEmail(params).subject).toBe('Set your password for the new Brillante system')
	})

	it('renders the link and the first name in text and HTML', () => {
		const email = buildOnboardingEmail(params, 'en')

		expect(email.text).toContain(params.resetUrl)
		expect(email.html).toContain(params.resetUrl)
		expect(email.text).toContain('Hello Ada')
	})

	it('renders Spanish content with voseo when the language is es', () => {
		const email = buildOnboardingEmail(params, 'es')

		expect(email.subject).toBe('Elegí tu contraseña para el nuevo sistema de Brillante')
		expect(email.text).toContain('Hola Ada')
		expect(email.text).toContain('Elegí una contraseña')
	})

	it('states the onboarding link lifetime taken from the constant', () => {
		expect(ONBOARDING_RESET_TOKEN_EXPIRY).toBe('1d')
		expect(buildOnboardingEmail(params, 'en').text).toContain('expires in 1 day ')
		expect(buildOnboardingEmail(params, 'es').text).toContain('caduca en 1 día ')
	})

	it('never contains a password', () => {
		const email = buildOnboardingEmail(params, 'en')

		expect(email.text.toLowerCase()).not.toMatch(/temporary password|contraseña temporal/)
	})

	it('escapes the first name and the link in the HTML', () => {
		const email = buildOnboardingEmail(
			{ firstName: '<script>alert(1)</script>', resetUrl: 'https://app.test/x?token=a&b="c"' },
			'en',
		)

		expect(email.html).not.toContain('<script>')
		expect(email.html).toContain('&lt;script&gt;')
		expect(email.html).toContain('token=a&amp;b=&quot;c&quot;')
	})
})
