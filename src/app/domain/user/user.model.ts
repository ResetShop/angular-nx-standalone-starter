import type { IPermission } from '../access/permission.interface';
import type { IRole } from '../access/role.interface';
import type { IUser } from './user.interface';

export class User implements IUser {
	readonly id: number;
	readonly email: string;
	readonly firstName: string;
	readonly lastName: string;
	readonly roles: readonly IRole[];

	private readonly _permissions: readonly IPermission[];
	private readonly _permissionIdentifiers: ReadonlySet<string>;

	constructor(id: number, email: string, firstName: string, lastName: string, roles: IRole[]) {
		this.id = id;
		this.email = email;
		this.firstName = firstName;
		this.lastName = lastName;
		this.roles = roles;

		const allPermissions = roles.flatMap((role) => role.permissions);
		this._permissions = [...new Map(allPermissions.map((p) => [p.identifier, p])).values()];
		this._permissionIdentifiers = new Set(this._permissions.map((p) => p.identifier));
	}

	get fullName(): string {
		return `${this.firstName} ${this.lastName}`.trim();
	}

	hasPermission(resource: string, action: string): boolean {
		return this._permissionIdentifiers.has(`${resource}:${action}`);
	}

	hasPermissionByIdentifier(identifier: string): boolean {
		return this._permissionIdentifiers.has(identifier);
	}

	hasRole(code: string): boolean {
		return this.roles.some((role) => role.code === code);
	}

	get permissions(): readonly IPermission[] {
		return this._permissions;
	}
}
