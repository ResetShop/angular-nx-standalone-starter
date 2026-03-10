import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type {
	CreateUserRequest,
	CreateUserResponse,
	ManagedUser,
	UpdateUserRequest,
	UpdateUserStatusRequest,
} from '@contracts/user/user.types';
import type { Observable } from 'rxjs';

interface ListUsersParams {
	offset?: number;
	limit?: number;
	search?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
	private readonly http = inject(HttpClient);

	getAll(params: ListUsersParams = {}): Observable<PaginatedResponse<ManagedUser>> {
		return this.http.get<PaginatedResponse<ManagedUser>>('/api/user', { params: { ...params } });
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
