import type { LoginResponse, MeResponse } from '@contracts/auth/auth.types';
import { mapRole } from '../access/role.mapper';
import type { IUser } from '../user/user.interface';
import { createUser } from '../user/user.mapper';

/**
 * Maps a login response to an IUser.
 *
 * Roles are intentionally empty — the login endpoint returns only the user
 * profile. Full roles with permissions are loaded via `GET /api/auth/me`
 * (see {@link mapMeResponseToUser}), which is called by the APP_INITIALIZER
 * on every bootstrap and after each page reload.
 */
export function mapLoginResponseToUser(response: LoginResponse): IUser {
	return createUser({
		id: response.user.id,
		email: response.user.email,
		firstName: response.user.firstName,
		lastName: response.user.lastName,
		roles: [], // Roles added via the /api/me endpoint
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
