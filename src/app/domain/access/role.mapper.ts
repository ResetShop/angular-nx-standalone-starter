import type { PermissionData, RoleWithPermissions } from '@contracts/roles/roles.types';
import type { IPermission } from './permission.interface';
import { Permission } from './permission.model';
import type { IRole } from './role.interface';
import { Role } from './role.model';

export function mapPermission(data: PermissionData): IPermission {
	return new Permission(data.id, data.name, data.description, data.resource, data.action);
}

export function mapRole(data: RoleWithPermissions): IRole {
	const permissions = data.permissions.map(mapPermission);
	return new Role(data.id, data.code, data.name, data.description, permissions);
}
