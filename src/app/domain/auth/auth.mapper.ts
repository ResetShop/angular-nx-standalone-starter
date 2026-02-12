import type { LoginResponse, MeResponse } from '@contracts/auth/auth.types';
import { mapRole } from '../access/role.mapper';
import type { IUser } from '../user/user.interface';
import { createUser } from '../user/user.mapper';

export function mapLoginResponseToUser(response: LoginResponse): IUser {
	return createUser({
		id: response.user.id,
		email: response.user.email,
		firstName: response.user.firstName,
		lastName: response.user.lastName,
		roles: [],
	});
}

export function mapMeResponseToUser(response: MeResponse): IUser {
	const roles = response.roles.map(mapRole);
	return createUser({
		id: response.id,
		email: response.email,
		firstName: response.firstName,
		lastName: response.lastName,
		roles,
	});
}
