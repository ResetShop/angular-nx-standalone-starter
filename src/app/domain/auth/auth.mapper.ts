import type { LoginResponse, MeResponse } from '@contracts/auth/auth.types';
import { mapRole } from '../access/role.mapper';
import type { IUser } from '../user/user.interface';
import { createUser } from '../user/user.mapper';
import type { AuthStorageData } from './auth-storage.type';

export function mapLoginResponseToUser(response: LoginResponse): IUser {
	return createUser(
		response.user.id,
		response.user.email,
		response.user.firstName,
		response.user.lastName,
		[],
		response.token,
	);
}

export function mapMeResponseToUser(response: MeResponse, token: string): IUser {
	const roles = response.roles.map(mapRole);
	return createUser(response.id, response.email, response.firstName, response.lastName, roles, token);
}

export function mapStorageDataToUser(data: AuthStorageData): IUser {
	const roles = data.roles.map(mapRole);
	return createUser(data.id, data.email, data.firstName, data.lastName, roles, data.token);
}

export function mapUserToStorageData(user: IUser): AuthStorageData {
	return {
		id: user.id,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		token: user.token,
		roles: user.roles.map((role) => ({
			id: role.id,
			code: role.code,
			name: role.name,
			description: role.description,
			permissions: role.permissions.map((p) => ({
				id: p.id,
				name: p.name,
				description: p.description,
				resource: p.resource,
				action: p.action,
			})),
		})),
	};
}
