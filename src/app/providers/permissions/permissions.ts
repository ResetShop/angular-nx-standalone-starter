import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type { PermissionData } from '@contracts/role/role.types';
import { map, type Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionsApiService {
	private readonly http = inject(HttpClient);

	getAllUnpaginated(): Observable<PermissionData[]> {
		// Backend-enforced maximum (QUERY_DEFAULTS.MAX_LIMIT); permissions are system-defined and expected to remain well below this cap
		const UNBOUNDED_LIMIT = 500;
		return this.http
			.get<PaginatedResponse<PermissionData>>('/api/access/permissions', {
				params: { limit: UNBOUNDED_LIMIT, offset: 0 },
			})
			.pipe(map((r) => r.data));
	}
}
