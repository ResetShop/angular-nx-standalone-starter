import type { IPermission } from './permission.interface';
import type { IRole } from './role.interface';

export class Role implements IRole {
	readonly id: number;
	readonly code: string;
	readonly name: string;
	readonly description: string | null;
	readonly permissions: readonly IPermission[];

	private readonly _permissionIdentifiers: ReadonlySet<string>;

	constructor(id: number, code: string, name: string, description: string | null, permissions: readonly IPermission[]) {
		this.id = id;
		this.code = code;
		this.name = name;
		this.description = description;
		this.permissions = permissions;
		this._permissionIdentifiers = new Set(permissions.map((p) => p.identifier));
	}

	hasPermission(resource: string, action: string): boolean {
		return this._permissionIdentifiers.has(`${resource}:${action}`);
	}

	hasPermissionByIdentifier(identifier: string): boolean {
		return this._permissionIdentifiers.has(identifier);
	}
}
