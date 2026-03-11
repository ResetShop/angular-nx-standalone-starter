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

	return {
		id: data.id,
		email: data.email,
		firstName: data.firstName,
		lastName: data.lastName,
		fullName: `${data.firstName} ${data.lastName}`.trim(),
		status: data.status,
		statusChangedAt: data.statusChangedAt,
		statusChangedBy: data.statusChangedBy,
		deletedAt: data.deletedAt,
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
		roles,
	};
}
