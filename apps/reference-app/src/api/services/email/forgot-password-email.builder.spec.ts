import { describe, expect, it } from 'vitest'
import { buildForgotPasswordEmail } from './forgot-password-email.builder'

describe('buildForgotPasswordEmail', () => {
	const params = {
		firstName: 'Ada',
		resetUrl: 'https://app.test/auth/reset-password/confirm?token=raw-token-abc',
	}

	it('renders the reset URL in both text and HTML (English)', () => {
		const email = buildForgotPasswordEmail(params, 'en')

		expect(email.subject).toBe('Reset your password')
		expect(email.text).toContain(params.resetUrl)
		expect(email.html).toContain(params.resetUrl)
		expect(email.text).toContain('Ada')
	})

	it('renders Spanish content when lang is es', () => {
		const email = buildForgotPasswordEmail(params, 'es')

		expect(email.subject).toBe('Restablece tu contraseña')
		expect(email.html).toContain(params.resetUrl)
	})

	it('escapes HTML-significant characters in the first name', () => {
		const email = buildForgotPasswordEmail({ ...params, firstName: '<script>' }, 'en')

		expect(email.html).not.toContain('<script>')
		expect(email.html).toContain('&lt;script&gt;')
	})
})
