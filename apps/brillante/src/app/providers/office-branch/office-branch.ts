import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { CreateOfficeBranchRequest, OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import type { Observable } from 'rxjs'
import { environment } from '../../environments/environment'
import type { OfficeBranchApi } from './office-branch.interface'

@Injectable({ providedIn: 'root' })
export class HttpOfficeBranchApi implements OfficeBranchApi {
	private readonly http = inject(HttpClient)

	public getAll(): Observable<OfficeBranchDto[]> {
		return this.http.get<OfficeBranchDto[]>(`${environment.apiUrl}/office-branch/getAll`)
	}

	public create(body: CreateOfficeBranchRequest): Observable<OfficeBranchDto> {
		return this.http.post<OfficeBranchDto>(`${environment.apiUrl}/office-branch/create`, body)
	}
}
