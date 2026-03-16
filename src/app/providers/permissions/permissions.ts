import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import { QUERY_DEFAULTS } from '@contracts/common/query.constants';
import type { PermissionData } from '@contracts/role/role.types';
import { map, type Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionsApiService {
	private readonly http = inject(HttpClient);

	getAllUnpaginated(): Observable<PermissionData[]> {
		return this.http
			.get<PaginatedResponse<PermissionData>>('/api/access/permissions', {
				params: { limit: QUERY_DEFAULTS.MAX_LIMIT, offset: 0 },
			})
			.pipe(map((r) => r.data));
	}
}
