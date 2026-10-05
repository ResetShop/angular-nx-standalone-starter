import { forgotPasswordRequestSchema, loginRequestSchema } from './auth.schemas'

describe('email normalisation of the auth request schemas', () => {
	it('lowercases the email of a login', () => {
		const parsed = loginRequestSchema.parse({ email: 'Admin@Brillantestore.COM', password: 'secret' })

		expect(parsed.email).toBe('admin@brillantestore.com')
	})

	it('lowercases the email of a password reset request', () => {
		expect(forgotPasswordRequestSchema.parse({ email: 'Admin@Brillantestore.COM' }).email).toBe(
			'admin@brillantestore.com',
		)
	})

	it('still rejects an invalid email', () => {
		expect(loginRequestSchema.safeParse({ email: 'NOT-AN-EMAIL', password: 'secret' }).success).toBe(false)
	})
})
