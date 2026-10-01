import { InjectionToken } from '@angular/core'
import type { CreateOfficeBranchRequest, OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import type { Observable } from 'rxjs'

export interface OfficeBranchApi {
	getAll(): Observable<OfficeBranchDto[]>
	create(body: CreateOfficeBranchRequest): Observable<OfficeBranchDto>
}

export const OfficeBranchApi = new InjectionToken<OfficeBranchApi>('OfficeBranchApi')
