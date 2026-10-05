import type { UserStatus } from '@contracts/user/user.constants'

/** A role assigned to a managed user. A role that is not removable stays assigned: the backend refuses dropping it. */
export interface ManagedUserRole {
	readonly id: number
	readonly description: string
	readonly removable: boolean
}

/** A user as the user management screen shows it. */
export interface ManagedUser {
	readonly id: number
	readonly firstName: string
	readonly lastName: string
	readonly fullName: string
	readonly email: string
	readonly status: UserStatus
	readonly roles: readonly ManagedUserRole[]
}
