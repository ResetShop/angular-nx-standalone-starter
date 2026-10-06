import { InjectionToken } from '@angular/core'
import type { ManagedUser, UpdateUserRequest } from '@contracts/user/user.types'
import type { Observable } from 'rxjs'

/** The backend's user management API. Creating users is not offered until the backend can email a password link. */
export interface ManagedUsersApi {
	/** Every user in one request: the backend's page limit is far above the number of staff. */
	getAll(): Observable<ManagedUser[]>
	/** Changes any combination of name, email, roles and status in one atomic request. */
	update(id: number, body: UpdateUserRequest): Observable<ManagedUser>
	delete(id: number): Observable<unknown>
	/** Sets a temporary password and emails it to the user, who must change it at the next sign-in. */
	resetPassword(id: number): Observable<unknown>
}

export const ManagedUsersApi = new InjectionToken<ManagedUsersApi>('ManagedUsersApi')
