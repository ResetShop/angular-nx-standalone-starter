import { inject, InjectionToken } from '@angular/core'
import type { PermissionData } from '@contracts/role/role.types'
import type { Observable } from 'rxjs'
import { HttpPermissionsApi } from './permissions'

export interface PermissionsApi {
	getAllUnpaginated(): Observable<PermissionData[]>
}

export const PermissionsApi = new InjectionToken<PermissionsApi>('PermissionsApi', {
	providedIn: 'root',
	factory: () => inject(HttpPermissionsApi),
})
