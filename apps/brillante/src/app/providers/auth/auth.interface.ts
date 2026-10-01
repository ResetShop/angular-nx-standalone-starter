import { InjectionToken } from '@angular/core'
import type { Auth0Profile, AuthenticatedUserDto } from '@contracts/user/user.types'
import type { Observable } from 'rxjs'

export interface AuthApi {
	/** Exchanges an Auth0 profile for the Brillante user plus an API-issued JWT. */
	authenticate(profile: Auth0Profile): Observable<AuthenticatedUserDto>
}

export const AuthApi = new InjectionToken<AuthApi>('AuthApi')
