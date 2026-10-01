import { PERMISSION_DEFINITIONS, Permission, UserRole } from '@contracts/permission/permission.constants'
import { User } from './user.model'

function buildUser(roleIds: number[], overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
	return new User({
		id: 1,
		userName: 'jdoe',
		email: 'jdoe@brillante.test',
		firstName: 'Jane',
		lastName: 'Doe',
		avatar: null,
		roles: roleIds.map((id) => ({ id, description: `role-${id}` })),
		hasFinishedRegistration: true,
		...overrides,
	})
}

describe('User', () => {
	it('builds the full name from first and last name', () => {
		expect(buildUser([UserRole.ADMIN]).fullName).toBe('Jane Doe')
	})

	it('falls back to the email when the user has no name', () => {
		const user = buildUser([UserRole.ADMIN], { firstName: null, lastName: null })

		expect(user.fullName).toBe('jdoe@brillante.test')
	})

	it('grants every permission of the roles the user holds', () => {
		const user = buildUser([UserRole.ACCOUNTANT])

		expect(user.hasPermission(Permission.REPORTS_CASH_READ)).toBe(true)
		expect(user.hasPermission(Permission.CASH_MANAGE)).toBe(false)
	})

	it('unions the permissions of multiple roles without duplicates', () => {
		const user = buildUser([UserRole.ADMIN, UserRole.OWNER])

		expect(new Set(user.permissions).size).toBe(user.permissions.length)
		expect(user.permissions).toHaveLength(PERMISSION_DEFINITIONS.length)
	})

	it('grants customers no internal permission', () => {
		expect(buildUser([UserRole.CUSTOMER]).permissions).toEqual([])
	})

	it('reports role membership', () => {
		const user = buildUser([UserRole.REPAIRMAN])

		expect(user.hasRole(UserRole.REPAIRMAN)).toBe(true)
		expect(user.hasRole(UserRole.ADMIN)).toBe(false)
	})

	it('rejects permission identifiers that are not in the catalogue', () => {
		expect(buildUser([UserRole.ADMIN]).hasPermission('repairs:repair:unknown')).toBe(false)
	})
})
