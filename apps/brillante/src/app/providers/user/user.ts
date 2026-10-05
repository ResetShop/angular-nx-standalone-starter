import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { CustomerDto } from '@contracts/client/client.types'
import type { UserDto } from '@contracts/user/legacy-user.types'
import type { Observable } from 'rxjs'
import { environment } from '../../environments/environment'
import type { UserApi } from './user.interface'

@Injectable({ providedIn: 'root' })
export class HttpUserApi implements UserApi {
	private readonly http = inject(HttpClient)

	public updateCustomerUser(user: Partial<UserDto>, customer: Partial<CustomerDto>): Observable<UserDto> {
		return this.http.put<UserDto>(`${environment.apiUrl}/users/updateCustomerUser`, { user, customer })
	}
}
