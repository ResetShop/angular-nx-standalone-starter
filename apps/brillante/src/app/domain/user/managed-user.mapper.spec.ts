import { UserStatus } from '@contracts/user/user.constants'
import { mapManagedUserDto } from './managed-user.mapper'
import { createManagedUserDto } from './managed-user.mock'

describe('mapManagedUserDto', () => {
	it('maps the identity, status and roles with their legacy ids', () => {
		const user = mapManagedUserDto(createManagedUserDto())

		expect(user).toEqual({
			id: 2,
			firstName: 'Ana',
			lastName: 'Perez',
			fullName: 'Ana Perez',
			email: 'ana.perez@brillante.test',
			status: UserStatus.ACTIVE,
			roles: [{ id: 2, description: 'Owner', removable: false }],
		})
	})

	it('falls back to the email when the user has no name', () => {
		const user = mapManagedUserDto(createManagedUserDto({ firstName: '', lastName: '' }))

		expect(user.fullName).toBe('ana.perez@brillante.test')
	})
})
