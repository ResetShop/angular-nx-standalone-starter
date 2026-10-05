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

export interface CreateUserRequest {
	email: string
	firstName: string
	lastName: string
	userName: string
	roles: RoleDto[]
}

export type UpdateUserRequest = Partial<CreateUserRequest> & { id: number }
