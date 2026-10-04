import { makeEnvironmentProviders } from '@angular/core'
import type { Auth0Profile } from '@contracts/user/legacy-user.types'
import { type Observable, of } from 'rxjs'
import type { IdentityApi } from './identity.interface'
import { IdentityApi as IdentityApiToken } from './identity.interface'

export class InMemoryIdentityApi implements IdentityApi {
	public profile: Auth0Profile | null = null
	public loginRedirects = 0
	public logouts = 0

	public getProfile(): Observable<Auth0Profile | null> {
		return of(this.profile)
	}

	public loginWithRedirect(): Observable<void> {
		this.loginRedirects++
		return of(undefined)
	}

	public logout(): Observable<void> {
		this.logouts++
		return of(undefined)
	}
}

export function provideIdentityMock(api: InMemoryIdentityApi = new InMemoryIdentityApi()) {
	return makeEnvironmentProviders([{ provide: IdentityApiToken, useValue: api }])
}
