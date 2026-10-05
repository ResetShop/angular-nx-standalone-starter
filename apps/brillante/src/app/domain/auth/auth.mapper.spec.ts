import { UserRole } from '@contracts/permission/legacy-permission.constants'
import type { AuthUser } from '@contracts/user/user.types'
import { mapAuthUserToUser, mapLoginResponseToUser, mapMeResponseToUser } from './auth.mapper'

const authUser: AuthUser = {
	id: 7,
	email: 'grace.hopper@example.test',
	firstName: 'Grace',
	lastName: 'Hopper',
	roles: [
		{
			id: UserRole.OWNER,
			code: 'owner',
			name: 'Owner',
			description: null,
			removable: false,
			createdAt: null,
			updatedAt: null,
			permissions: [],
		},
	],
}

describe('Auth Mapper', () => {
	describe('mapAuthUserToUser', () => {
		it('maps the identity fields', () => {
			const user = mapAuthUserToUser(authUser)

			expect(user.id).toBe(7)
			expect(user.email).toBe('grace.hopper@example.test')
			expect(user.fullName).toBe('Grace Hopper')
		})

		it('derives the user name from the part of the email before the @', () => {
			expect(mapAuthUserToUser(authUser).userName).toBe('grace.hopper')
		})

		it('keeps the legacy role ids, which the permission table is keyed by', () => {
			const user = mapAuthUserToUser(authUser)

			expect(user.roles).toEqual([{ id: UserRole.OWNER, description: 'Owner' }])
			expect(user.hasRole(UserRole.OWNER)).toBe(true)
			expect(user.hasRole(UserRole.ADMIN)).toBe(false)
		})

		it('grants the permissions of the user roles from the frontend permission table', () => {
			expect(mapAuthUserToUser(authUser).permissions.length).toBeGreaterThan(0)
			expect(mapAuthUserToUser({ ...authUser, roles: [] }).permissions).toEqual([])
		})
	})

	it('maps the login and /me responses to the same user', () => {
		expect(mapLoginResponseToUser({ user: authUser, mustChangePassword: false })).toEqual(mapAuthUserToUser(authUser))
		expect(mapMeResponseToUser({ ...authUser, mustChangePassword: false })).toEqual(mapAuthUserToUser(authUser))
	})
})
