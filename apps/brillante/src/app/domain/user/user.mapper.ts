import type { UserDto } from '@contracts/user/user.types'
import { User } from './user.model'

export function mapUserDtoToUser(dto: UserDto): User {
	return new User({
		id: dto.id,
		userName: dto.userName,
		email: dto.email,
		firstName: dto.firstName,
		lastName: dto.lastName,
		avatar: dto.avatar,
		roles: dto.roles ?? [],
		hasFinishedRegistration: dto.hasFinishedRegistration,
	})
}
