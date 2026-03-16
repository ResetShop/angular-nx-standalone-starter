import type { IPermission } from './permission.interface'
import { Permission } from './permission.model'

interface CreatePermissionOptions {
	id: number
	name: string
	description: string | null
	resource: string
	action: string
}

export function createPermission(options: CreatePermissionOptions): IPermission {
	return new Permission(options.id, options.name, options.description, options.resource, options.action)
}
