import type { LoginResponse, MeResponse } from '@contracts/auth/auth.types'
import type { AuthUser } from '@contracts/user/user.types'
import type { IUser } from '../user/user.interface'
import { User } from '../user/user.model'

/**
 * Maps an authenticated-user payload — the shape shared by login and `/api/auth/me` — to an IUser.
 *
 * The backend identifies roles by the legacy ids (1 to 7), which the frontend permission table is keyed by.
 * `userName` is the part of the email before the `@`: the new backend has no user names, and screens and
 * legacy API payloads still show one.
 */
export function mapAuthUserToUser(user: AuthUser): IUser {
	return new User({
		id: user.id,
		userName: user.email.split('@')[0],
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		avatar: null,
		roles: user.roles.map((role) => ({ id: role.id, description: role.name })),
		hasFinishedRegistration: true,
	})
}

/**
 * Maps a login response to an IUser. The login endpoint returns the full roles payload, so `currentUser`
 * is fully populated in a single round-trip.
 */
export function mapLoginResponseToUser(response: LoginResponse): IUser {
	return mapAuthUserToUser(response.user)
}

/**
 * Maps a `/api/auth/me` response to an IUser. Used by `validateSession()` on protected route activation.
 */
export function mapMeResponseToUser(response: MeResponse): IUser {
	return mapAuthUserToUser(response)
}
