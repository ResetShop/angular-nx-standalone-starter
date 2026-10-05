import { createUserRequestSchema, updateProfileRequestSchema, updateUserRequestSchema } from './user.schemas'

describe('email normalisation of the user request schemas', () => {
	it('lowercases the email of a new user', () => {
		const parsed = createUserRequestSchema.parse({
			email: 'Ana.Perez@Brillante.TEST',
			firstName: 'Ana',
			lastName: 'Perez',
		})

		expect(parsed.email).toBe('ana.perez@brillante.test')
	})

	it('lowercases the email of an update and leaves it absent when not sent', () => {
		expect(updateUserRequestSchema.parse({ email: 'ANA@Brillante.test' }).email).toBe('ana@brillante.test')
		expect(updateUserRequestSchema.parse({ firstName: 'Ana' }).email).toBeUndefined()
	})

	it('still rejects an invalid email', () => {
		expect(createUserRequestSchema.safeParse({ email: 'NOT-AN-EMAIL', firstName: 'A', lastName: 'B' }).success).toBe(
			false,
		)
	})
})

describe('updateProfileRequestSchema', () => {
	it('accepts a first-name-only update', () => {
		expect(updateProfileRequestSchema.safeParse({ firstName: 'Ada' }).success).toBe(true)
	})

	it('accepts a last-name-only update', () => {
		expect(updateProfileRequestSchema.safeParse({ lastName: 'Lovelace' }).success).toBe(true)
	})

	it('accepts both names together', () => {
		expect(updateProfileRequestSchema.safeParse({ firstName: 'Ada', lastName: 'Lovelace' }).success).toBe(true)
	})

	it('rejects an email change', () => {
		expect(updateProfileRequestSchema.safeParse({ firstName: 'Ada', email: 'ada@example.com' }).success).toBe(false)
	})

	it.each([
		['roleIds', [1]],
		['status', 'disabled'],
		['id', 2],
	])('rejects the admin-only field %s', (field, value) => {
		expect(updateProfileRequestSchema.safeParse({ firstName: 'Ada', [field]: value }).success).toBe(false)
	})

	it('rejects an empty body', () => {
		expect(updateProfileRequestSchema.safeParse({}).success).toBe(false)
	})

	it('rejects an empty name', () => {
		expect(updateProfileRequestSchema.safeParse({ firstName: '' }).success).toBe(false)
	})
})
