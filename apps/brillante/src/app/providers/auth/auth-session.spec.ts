import { TestBed } from '@angular/core/testing'
import type { AuthenticatedUserDto } from '@contracts/user/user.types'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { AuthSession } from './auth-session'

const session: AuthenticatedUserDto = {
	id: 1,
	userName: 'jdoe',
	firstName: 'Jane',
	lastName: 'Doe',
	avatar: null,
	email: 'jdoe@brillante.test',
	roles: [],
	hasFinishedRegistration: true,
	token: 'jwt-token',
}

describe('AuthSession', () => {
	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()
	})

	it('has no session and no token when nothing is stored', () => {
		const authSession = TestBed.inject(AuthSession)

		expect(authSession.read()).toBeNull()
		expect(authSession.token).toBeNull()
	})

	it('persists the session and exposes its token', () => {
		const authSession = TestBed.inject(AuthSession)

		authSession.write(session)

		expect(authSession.token).toBe('jwt-token')
		expect(JSON.parse(localStorage.getItem('currentUser') ?? '{}')).toEqual(session)
	})

	it('reads a session persisted by a previous page load', () => {
		localStorage.setItem('currentUser', JSON.stringify(session))

		expect(TestBed.inject(AuthSession).read()).toEqual(session)
	})

	it('discards a persisted value that is not valid JSON', () => {
		localStorage.setItem('currentUser', '{not json')

		expect(TestBed.inject(AuthSession).read()).toBeNull()
		expect(localStorage.getItem('currentUser')).toBeNull()
	})

	it('ignores a persisted session that carries no token', () => {
		localStorage.setItem('currentUser', JSON.stringify({ ...session, token: '' }))

		expect(TestBed.inject(AuthSession).read()).toBeNull()
	})

	it('clears the session from memory and storage', () => {
		const authSession = TestBed.inject(AuthSession)
		authSession.write(session)

		authSession.clear()

		expect(authSession.read()).toBeNull()
		expect(localStorage.getItem('currentUser')).toBeNull()
	})
})
