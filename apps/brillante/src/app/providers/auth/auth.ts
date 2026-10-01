import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Auth0Profile, AuthenticatedUserDto } from '@contracts/user/user.types'
import type { Observable } from 'rxjs'
import { environment } from '../../environments/environment'
import type { AuthApi } from './auth.interface'

@Injectable({ providedIn: 'root' })
export class HttpAuthApi implements AuthApi {
	private readonly http = inject(HttpClient)

	public authenticate(profile: Auth0Profile): Observable<AuthenticatedUserDto> {
		return this.http.post<AuthenticatedUserDto>(`${environment.apiUrl}/users/authenticate`, { user: profile })
	}
}
