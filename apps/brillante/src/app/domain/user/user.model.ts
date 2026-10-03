import { PERMISSION_DEFINITIONS, type UserRole } from '@contracts/permission/legacy-permission.constants'
import type { RoleDto } from '@contracts/user/legacy-user.types'
import type { IUser } from './user.interface'

export interface UserProps {
	id: number
	userName: string
	email: string
	firstName: string | null
	lastName: string | null
	avatar: string | null
	roles: readonly RoleDto[]
	hasFinishedRegistration: boolean
}

export class User implements IUser {
	public readonly id: number
	public readonly userName: string
	public readonly email: string
	public readonly firstName: string
	public readonly lastName: string
	public readonly avatar: string | null
	public readonly roles: readonly RoleDto[]
	public readonly hasFinishedRegistration: boolean
	public readonly permissions: readonly string[]

	private readonly permissionSet: ReadonlySet<string>

	constructor(props: UserProps) {
		this.id = props.id
		this.userName = props.userName
		this.email = props.email
		this.firstName = props.firstName ?? ''
		this.lastName = props.lastName ?? ''
		this.avatar = props.avatar
		this.roles = props.roles
		this.hasFinishedRegistration = props.hasFinishedRegistration

		const roleIds = new Set<number>(props.roles.map((role) => role.id))
		this.permissions = PERMISSION_DEFINITIONS.filter((definition) =>
			definition.roles.some((role: UserRole) => roleIds.has(role)),
		).map((definition) => definition.identifier)
		this.permissionSet = new Set(this.permissions)
	}

	public get fullName(): string {
		return `${this.firstName} ${this.lastName}`.trim() || this.email
	}

	public hasPermission(identifier: string): boolean {
		return this.permissionSet.has(identifier)
	}

	public hasRole(roleId: number): boolean {
		return this.roles.some((role) => role.id === roleId)
	}
}
