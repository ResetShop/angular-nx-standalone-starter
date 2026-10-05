import type { ManagedUser as ManagedUserDto } from '@contracts/user/user.types'
import type { ManagedUser } from './managed-user.interface'

/**
 * Maps a user of the backend's management API to the screen's model. Roles keep the legacy ids (1 to 7), which the
 * role options and the permission table are keyed by.
 */
export function mapManagedUserDto(dto: ManagedUserDto): ManagedUser {
	return {
		id: dto.id,
		firstName: dto.firstName,
		lastName: dto.lastName,
		fullName: `${dto.firstName} ${dto.lastName}`.trim() || dto.email,
		email: dto.email,
		status: dto.status,
		roles: dto.roles.map((role) => ({ id: role.id, description: role.name, removable: role.removable })),
	}
}
