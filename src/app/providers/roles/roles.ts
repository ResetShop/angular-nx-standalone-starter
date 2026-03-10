import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import { QUERY_DEFAULTS } from '@contracts/common/query.constants';
import type {
	AssignPermissionsRequest,
	CreateRoleRequest,
	PermissionData,
	RoleData,
	RoleWithPermissions,
	UpdateRoleRequest,
} from '@contracts/role/role.types';
import { forkJoin, map, type Observable } from 'rxjs';

interface ListRolesParams {
	offset?: number;
	limit?: number;
	search?: string;
}

@Injectable({ providedIn: 'root' })
export class RolesApiService {
	private readonly http = inject(HttpClient);

	getAll(params: ListRolesParams = {}): Observable<PaginatedResponse<RoleData>> {
		return this.http.get<PaginatedResponse<RoleData>>('/api/access/roles', { params: { ...params } });
	}

	getAllUnpaginated(): Observable<RoleData[]> {
		return this.http
			.get<PaginatedResponse<RoleData>>('/api/access/roles', { params: { limit: QUERY_DEFAULTS.MAX_LIMIT, offset: 0 } })
			.pipe(map((r) => r.data));
	}

	getByIdWithPermissions(id: number): Observable<RoleWithPermissions> {
		return forkJoin({
			role: this.http.get<RoleData>(`/api/access/roles/${id}`),
			permissions: this.http
				.get<PaginatedResponse<PermissionData>>(`/api/access/roles/${id}/permissions`, {
					params: { limit: QUERY_DEFAULTS.MAX_LIMIT, offset: 0 },
				})
				.pipe(map((r) => r.data)),
		}).pipe(
			map(({ role, permissions }) => ({
				id: role.id,
				code: role.code,
				name: role.name,
				description: role.description,
				permissions,
			})),
		);
	}

	create(body: CreateRoleRequest): Observable<RoleData> {
		return this.http.post<RoleData>('/api/access/roles', body);
	}

	update(id: number, body: UpdateRoleRequest): Observable<RoleData> {
		return this.http.put<RoleData>(`/api/access/roles/${id}`, body);
	}

	delete(id: number): Observable<void> {
		return this.http.delete<void>(`/api/access/roles/${id}`);
	}

	assignPermissions(id: number, body: AssignPermissionsRequest): Observable<void> {
		return this.http.put<void>(`/api/access/roles/${id}/permissions`, body);
	}
}
