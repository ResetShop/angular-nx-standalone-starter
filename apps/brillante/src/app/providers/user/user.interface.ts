import { InjectionToken } from '@angular/core'
import type { CustomerDto } from '@contracts/client/client.types'
import type { UserDto } from '@contracts/user/legacy-user.types'
import type { Observable } from 'rxjs'

/** The part of the legacy API's users module the app still uses; user management runs on the app's own backend. */
export interface UserApi {
	/** Saves the signed-in customer's own profile: the user record together with its customer details. */
	updateCustomerUser(user: Partial<UserDto>, customer: Partial<CustomerDto>): Observable<UserDto>
}

export const UserApi = new InjectionToken<UserApi>('UserApi')
