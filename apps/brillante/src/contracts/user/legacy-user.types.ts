import type { CustomerDto } from '../client/client.types'

export interface RoleDto {
	id: number
	description: string
}

export interface UserDto {
	id: number
	userName: string
	firstName: string | null
	lastName: string | null
	avatar: string | null
	email: string
	roles: RoleDto[]
	hasFinishedRegistration: boolean
	customer?: CustomerDto | null
}

/**
 * Response of `POST /users/authenticate`: the user plus the API-issued JWT.
 */
export interface AuthenticatedUserDto extends UserDto {
	token: string
}

/**
 * Profile returned by Auth0 after a successful login. It is forwarded verbatim to the API,
 * which resolves (or creates) the matching Brillante user by email.
 */
export interface Auth0Profile {
	email?: string
	name?: string
	nickname?: string
	picture?: string
	sub?: string
	[claim: string]: unknown
}

export interface CreateUserRequest {
	email: string
	firstName: string
	lastName: string
	userName: string
	roles: RoleDto[]
}

export type UpdateUserRequest = Partial<CreateUserRequest> & { id: number }
