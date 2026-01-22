import type { IPermission } from '../access/permission.interface';
import type { IRole } from '../access/role.interface';
import type { IUser } from './user.interface';

export class User implements IUser {
	readonly id: number;
	readonly email: string;
	readonly firstName: string;
	readonly lastName: string;
	readonly roles: readonly IRole[];
	readonly token: string;

	private readonly _permissions: readonly IPermission[];

	constructor(id: number, email: string, firstName: string, lastName: string, roles: IRole[], token: string) {
		this.id = id;
		this.email = email;
		this.firstName = firstName;
		this.lastName = lastName;
		this.roles = roles;
		this.token = token;

		const allPermissions = roles.flatMap((role) => role.permissions);
		this._permissions = [...new Map(allPermissions.map((p) => [p.identifier, p])).values()];
	}

	get fullName(): string {
		return `${this.firstName} ${this.lastName}`;
	}

	hasPermission(resource: string, action: string): boolean {
		return this._permissions.some((p) => p.matches(resource, action));
	}

	hasPermissionByIdentifier(identifier: string): boolean {
		return this._permissions.some((p) => p.identifier === identifier);
	}

	hasRole(code: string): boolean {
		return this.roles.some((role) => role.code === code);
	}

	get permissions(): readonly IPermission[] {
		return this._permissions;
	}
}
