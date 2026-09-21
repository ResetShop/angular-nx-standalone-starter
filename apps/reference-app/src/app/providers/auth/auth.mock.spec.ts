import type { MeResponse } from '@contracts/auth/auth.types'
import type { AuthUser } from '@contracts/user/user.types'
import { InMemoryAuthApi } from './auth.mock'

describe('InMemoryAuthApi.updateProfile', () => {
	const session: MeResponse = {
		id: 1,
		email: 'ada@example.com',
		firstName: 'Ada',
		lastName: 'Lovelace',
		roles: [],
		mustChangePassword: false,
	}

	let api: InMemoryAuthApi

	beforeEach(() => {
		api = new InMemoryAuthApi()
	})

	it('merges the patch into the session user and returns it without session-only fields', () => {
		api.setAuthenticatedUser(session)
		let updated: AuthUser | undefined
		let me: MeResponse | undefined

		api.updateProfile({ firstName: 'Grace' }).subscribe((user) => (updated = user))
		api.getMe().subscribe((user) => (me = user))

		expect(updated).toEqual({ id: 1, email: 'ada@example.com', firstName: 'Grace', lastName: 'Lovelace', roles: [] })
		expect(me?.firstName).toBe('Grace')
	})

	it('errors when there is no session', () => {
		let failure: Error | undefined

		api.updateProfile({ firstName: 'Grace' }).subscribe({ error: (error: Error) => (failure = error) })

		expect(failure?.message).toBe('No session')
	})

	it('surfaces a configured error', () => {
		api.setAuthenticatedUser(session)
		api.setError('updateProfile', new Error('Boom'))
		let failure: Error | undefined

		api.updateProfile({ firstName: 'Grace' }).subscribe({ error: (error: Error) => (failure = error) })

		expect(failure?.message).toBe('Boom')
	})
})
