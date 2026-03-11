import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { PaginatedResponse, SearchPaginationParams } from '@contracts/common/pagination.types';
import { QUERY_DEFAULTS } from '@contracts/common/query.constants';
import type {
	CreateUserRequest,
	CreateUserResponse,
	ManagedUser,
	UpdateUserRequest,
	UpdateUserStatusRequest,
} from '@contracts/user/user.types';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
	private readonly http = inject(HttpClient);

	getAll({
		offset = QUERY_DEFAULTS.OFFSET,
		limit = QUERY_DEFAULTS.LIMIT,
		search,
	}: SearchPaginationParams = {}): Observable<PaginatedResponse<ManagedUser>> {
		const params: Record<string, string | number> = { offset, limit };
		if (search) {
			params['search'] = search;
		}
		return this.http.get<PaginatedResponse<ManagedUser>>('/api/user', { params });
	}

	getById(id: number): Observable<ManagedUser> {
		return this.http.get<ManagedUser>(`/api/user/${id}`);
	}

	create(body: CreateUserRequest): Observable<CreateUserResponse> {
		return this.http.post<CreateUserResponse>('/api/user', body);
	}

	update(id: number, body: UpdateUserRequest): Observable<ManagedUser> {
		return this.http.patch<ManagedUser>(`/api/user/${id}`, body);
	}

	delete(id: number): Observable<void> {
		return this.http.delete<void>(`/api/user/${id}`);
	}

	updateStatus(id: number, body: UpdateUserStatusRequest): Observable<ManagedUser> {
		return this.http.patch<ManagedUser>(`/api/user/${id}/status`, body);
	}
}
