import type { RoleDto } from '@contracts/user/user.types'

export interface IUser {
	readonly id: number
	readonly userName: string
	readonly email: string
	readonly firstName: string
	readonly lastName: string
	readonly fullName: string
	readonly avatar: string | null
	readonly roles: readonly RoleDto[]
	readonly permissions: readonly string[]
	readonly hasFinishedRegistration: boolean
	hasPermission(identifier: string): boolean
	hasRole(roleId: number): boolean
}
