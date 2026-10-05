import { UserStatus } from '@contracts/user/user.constants'
import type { ManagedUser as ManagedUserDto } from '@contracts/user/user.types'

/** A user of the backend's management API, for specs. */
export function createManagedUserDto(overrides: Partial<ManagedUserDto> = {}): ManagedUserDto {
	return {
		id: 2,
		email: 'ana.perez@brillante.test',
		firstName: 'Ana',
		lastName: 'Perez',
		status: UserStatus.ACTIVE,
		statusChangedAt: null,
		statusChangedBy: null,
		deletedAt: null,
		createdAt: null,
		updatedAt: null,
		roles: [
			{
				id: 2,
				code: 'owner',
				name: 'Owner',
				description: null,
				removable: false,
				createdAt: null,
				updatedAt: null,
			},
		],
		...overrides,
	}
}
