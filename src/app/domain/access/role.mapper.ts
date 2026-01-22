import type { PermissionData, RoleWithPermissions } from '@contracts/roles/roles.types';
import type { IPermission } from './permission.interface';
import { createPermission } from './permission.mapper';
import type { IRole } from './role.interface';
import { Role } from './role.model';

export function mapPermission(data: PermissionData): IPermission {
	return createPermission({
		id: data.id,
		name: data.name,
		description: data.description,
		resource: data.resource,
		action: data.action,
	});
}

export interface CreateRoleOptions {
	id: number;
	code: string;
	name: string;
	description: string | null;
	permissions: IPermission[];
}

export function createRole(options: CreateRoleOptions): IRole {
	return new Role(options.id, options.code, options.name, options.description, options.permissions);
}

export function mapRole(data: RoleWithPermissions): IRole {
	const permissions = data.permissions.map(mapPermission);
	return createRole({
		id: data.id,
		code: data.code,
		name: data.name,
		description: data.description,
		permissions,
	});
}
