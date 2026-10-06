import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { PaginatedResponse } from '@contracts/common/pagination.types'
import type { ManagedUser, UpdateUserRequest } from '@contracts/user/user.types'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { map, type Observable } from 'rxjs'
import type { ManagedUsersApi } from './managed-users.interface'

@Injectable({ providedIn: 'root' })
export class HttpManagedUsersApi implements ManagedUsersApi {
	private readonly http = inject(HttpClient)
	private readonly logger = inject(Logger)

	public getAll(): Observable<ManagedUser[]> {
		// The largest page the backend serves.
		const params = new HttpParams().set('limit', 500)
		return this.http.get<PaginatedResponse<ManagedUser>>('/api/users', { params }).pipe(
			map((page) => {
				if (page.total > page.data.length) {
					this.logger.warn('ManagedUsersApi', `only ${page.data.length} of ${page.total} users were loaded`)
				}
				return page.data
			}),
		)
	}

	public update(id: number, body: UpdateUserRequest): Observable<ManagedUser> {
		return this.http.patch<ManagedUser>(`/api/users/${id}`, body)
	}

	public delete(id: number): Observable<unknown> {
		return this.http.delete(`/api/users/${id}`)
	}

	public resetPassword(id: number): Observable<unknown> {
		return this.http.post(`/api/users/${id}/reset-password`, {})
	}
}
