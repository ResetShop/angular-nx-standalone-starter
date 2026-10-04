import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { CustomerDto } from '@contracts/client/client.types'
import type { CreateUserRequest, UpdateUserRequest, UserDto } from '@contracts/user/legacy-user.types'
import type { Observable } from 'rxjs'
import { environment } from '../../environments/environment'
import type { UserApi } from './user.interface'

@Injectable({ providedIn: 'root' })
export class HttpUserApi implements UserApi {
	private readonly http = inject(HttpClient)

	public getAll(): Observable<UserDto[]> {
		return this.http.get<UserDto[]>(`${environment.apiUrl}/users`)
	}

	public getById(id: number): Observable<UserDto> {
		return this.http.get<UserDto>(`${environment.apiUrl}/users/${id}`)
	}

	public register(body: CreateUserRequest): Observable<UserDto> {
		return this.http.post<UserDto>(`${environment.apiUrl}/users/register`, body)
	}

	public update(body: UpdateUserRequest): Observable<unknown> {
		return this.http.put(`${environment.apiUrl}/users/${body.id}`, body)
	}

	public updateCustomerUser(user: Partial<UserDto>, customer: Partial<CustomerDto>): Observable<UserDto> {
		return this.http.put<UserDto>(`${environment.apiUrl}/users/updateCustomerUser`, { user, customer })
	}

	public delete(id: number): Observable<unknown> {
		return this.http.delete(`${environment.apiUrl}/users/${id}`)
	}
}
