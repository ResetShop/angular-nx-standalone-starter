import { InjectionToken } from '@angular/core'
import type { Auth0Profile } from '@contracts/user/user.types'
import type { Observable } from 'rxjs'

/**
 * Gateway to the external identity provider (Auth0). It owns the browser redirect flows and
 * exposes the authenticated profile; it knows nothing about Brillante users or roles.
 */
export interface IdentityApi {
	/** Emits once the provider finished resolving the session: the profile, or null when signed out. */
	getProfile(): Observable<Auth0Profile | null>
	/** Redirects the browser to the provider login page. */
	loginWithRedirect(): Observable<void>
	/** Ends the provider session (federated) and redirects back to the application. */
	logout(): Observable<void>
}

export const IdentityApi = new InjectionToken<IdentityApi>('IdentityApi')
