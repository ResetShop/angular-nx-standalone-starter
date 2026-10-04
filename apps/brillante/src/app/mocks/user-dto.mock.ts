import type { UserDto } from '@contracts/user/legacy-user.types'

/**
 * Create a wire-format user for API stubs. Override specific fields as needed.
 */
export function createMockUserDto(overrides: Partial<UserDto> = {}): UserDto {
	return {
		id: 1,
		userName: 'jdoe',
		firstName: 'Jane',
		lastName: 'Doe',
		avatar: null,
		email: 'jane.doe@example.com',
		roles: [{ id: 3, description: 'COUNTER_CLERK' }],
		hasFinishedRegistration: true,
		...overrides,
	}
}
