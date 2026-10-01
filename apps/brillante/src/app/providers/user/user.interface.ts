import { InjectionToken } from '@angular/core'
import type { CustomerDto } from '@contracts/client/client.types'
import type { CreateUserRequest, UpdateUserRequest, UserDto } from '@contracts/user/user.types'
import type { Observable } from 'rxjs'

export interface UserApi {
	getAll(): Observable<UserDto[]>
	getById(id: number): Observable<UserDto>
	register(body: CreateUserRequest): Observable<UserDto>
	update(body: UpdateUserRequest): Observable<unknown>
	/** Saves the signed-in customer's own profile: the user record together with its customer details. */
	updateCustomerUser(user: Partial<UserDto>, customer: Partial<CustomerDto>): Observable<UserDto>
	delete(id: number): Observable<unknown>
}

export const UserApi = new InjectionToken<UserApi>('UserApi')
