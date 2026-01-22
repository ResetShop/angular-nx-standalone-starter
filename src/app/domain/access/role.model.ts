import type { IPermission } from './permission.interface';
import type { IRole } from './role.interface';

export class Role implements IRole {
	readonly id: number;
	readonly code: string;
	readonly name: string;
	readonly description: string | null;
	readonly permissions: readonly IPermission[];

	constructor(id: number, code: string, name: string, description: string | null, permissions: readonly IPermission[]) {
		this.id = id;
		this.code = code;
		this.name = name;
		this.description = description;
		this.permissions = permissions;
	}

	hasPermission(resource: string, action: string): boolean {
		return this.permissions.some((p) => p.matches(resource, action));
	}

	hasPermissionByIdentifier(identifier: string): boolean {
		return this.permissions.some((p) => p.identifier === identifier);
	}
}
