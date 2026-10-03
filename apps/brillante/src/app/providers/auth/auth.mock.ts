import { makeEnvironmentProviders } from '@angular/core'
import type { Auth0Profile, AuthenticatedUserDto } from '@contracts/user/legacy-user.types'
import { type Observable, of, throwError } from 'rxjs'
import type { AuthApi } from './auth.interface'
import { AuthApi as AuthApiToken } from './auth.interface'

export class InMemoryAuthApi implements AuthApi {
	private errors = new Map<string, Error>()
	private response: AuthenticatedUserDto | null = null

	public setError(method: keyof AuthApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public setResponse(response: AuthenticatedUserDto): void {
		this.response = response
	}

	public authenticate(profile: Auth0Profile): Observable<AuthenticatedUserDto> {
		const error = this.errors.get('authenticate')
		if (error) return throwError(() => error)
		return of(
			this.response ?? {
				id: 1,
				userName: profile.nickname ?? 'user',
				firstName: profile.name ?? '',
				lastName: '',
				avatar: profile.picture ?? null,
				email: profile.email ?? '',
				roles: [],
				hasFinishedRegistration: true,
				token: 'in-memory-token',
			},
		)
	}
}

export function provideAuthMock(api: InMemoryAuthApi = new InMemoryAuthApi()) {
	return makeEnvironmentProviders([{ provide: AuthApiToken, useValue: api }])
}
