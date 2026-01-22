import type { IPermission } from './permission.interface';

export interface IRole {
	readonly id: number;
	readonly code: string;
	readonly name: string;
	readonly description: string | null;
	readonly permissions: readonly IPermission[];

	hasPermission(resource: string, action: string): boolean;
	hasPermissionByIdentifier(identifier: string): boolean;
}
