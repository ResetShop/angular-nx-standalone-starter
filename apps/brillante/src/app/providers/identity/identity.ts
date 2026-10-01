import { inject, Injectable } from '@angular/core'
import { AuthService } from '@auth0/auth0-angular'
import type { Auth0Profile } from '@contracts/user/user.types'
import { filter, map, type Observable, switchMap, take } from 'rxjs'
import type { IdentityApi } from './identity.interface'

@Injectable({ providedIn: 'root' })
export class Auth0IdentityApi implements IdentityApi {
	private readonly auth0 = inject(AuthService)

	public getProfile(): Observable<Auth0Profile | null> {
		return this.auth0.isLoading$.pipe(
			filter((isLoading) => !isLoading),
			take(1),
			switchMap(() => this.auth0.user$.pipe(take(1))),
			map((profile) => (profile as Auth0Profile | null | undefined) ?? null),
		)
	}

	public loginWithRedirect(): Observable<void> {
		return this.auth0.loginWithRedirect({ authorizationParams: { redirect_uri: window.location.origin } })
	}

	public logout(): Observable<void> {
		return this.auth0.logout({ logoutParams: { federated: true, returnTo: window.location.origin } })
	}
}
