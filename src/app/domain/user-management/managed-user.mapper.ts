import type { ManagedUser } from '@contracts/user/user.types';
import type { IManagedUser, IManagedUserRole } from './managed-user.interface';

interface CreateManagedUserRoleOptions {
	id: number;
	name: string;
	code: string;
	description: string | null;
	removable: boolean;
	createdAt: Date | null;
	updatedAt: Date | null;
}

export function createManagedUserRole(options: CreateManagedUserRoleOptions): IManagedUserRole {
	return { ...options };
}

interface CreateManagedUserOptions {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	status: IManagedUser['status'];
	statusChangedAt: Date | null;
	statusChangedBy: number | null;
	deletedAt: Date | null;
	createdAt: Date | null;
	updatedAt: Date | null;
	roles: readonly IManagedUserRole[];
}

export function createManagedUser(options: CreateManagedUserOptions): IManagedUser {
	return {
		...options,
		fullName: `${options.firstName} ${options.lastName}`.trim(),
	};
}

export function mapManagedUserResponse(data: ManagedUser): IManagedUser {
	const roles = data.roles.map((r) =>
		createManagedUserRole({
			id: r.id,
			name: r.name,
			code: r.code,
			description: r.description,
			removable: r.removable,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
		}),
	);

	return createManagedUser({
		id: data.id,
		email: data.email,
		firstName: data.firstName,
		lastName: data.lastName,
		status: data.status,
		statusChangedAt: data.statusChangedAt,
		statusChangedBy: data.statusChangedBy,
		deletedAt: data.deletedAt,
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
		roles,
	});
}
