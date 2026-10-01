import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type {
	CreateRepairRequest,
	CreateRepairResponse,
	DeleteRepairResponse,
	RepairDto,
	RepairsByDateParams,
	RepairStatusDto,
	RepairStatusHistoryDto,
	RepairWriteDto,
	UpdateTrackingInfoRequest,
} from '@contracts/repair/repair.types'
import { format } from 'date-fns'
import type { Observable } from 'rxjs'
import { environment } from '../../environments/environment'
import type { RepairApi } from './repair.interface'

@Injectable({ providedIn: 'root' })
export class HttpRepairApi implements RepairApi {
	private readonly http = inject(HttpClient)
	private readonly baseUrl = `${environment.apiUrl}/repair`

	public getAll(showFinished: boolean): Observable<RepairDto[]> {
		const params = new HttpParams().set('showFinished', showFinished.toString())
		return this.http.get<RepairDto[]>(this.baseUrl, { params })
	}

	public getAllByDate({ dateFrom, dateTo, showFinished }: RepairsByDateParams): Observable<RepairDto[]> {
		const params = new HttpParams()
			.set('showFinished', showFinished.toString())
			.append('startDate', `${format(dateFrom, 'yyyy-MM-dd')} 00:00:00`)
			.append('endDate', `${format(dateTo, 'yyyy-MM-dd')} 23:59:59`)
		return this.http.get<RepairDto[]>(`${this.baseUrl}/byDate`, { params })
	}

	public getById(id: number): Observable<RepairDto> {
		return this.http.get<RepairDto>(`${this.baseUrl}/${id}`)
	}

	public getHistory(id: number): Observable<RepairStatusHistoryDto[]> {
		return this.http.get<RepairStatusHistoryDto[]>(`${this.baseUrl}/history/${id}`)
	}

	public getByClientId(clientId: number): Observable<RepairDto[]> {
		return this.http.get<RepairDto[]>(`${this.baseUrl}/getByClientId/${clientId}`)
	}

	public create(body: CreateRepairRequest): Observable<CreateRepairResponse> {
		return this.http.post<CreateRepairResponse>(`${this.baseUrl}/create`, body)
	}

	public updateDeviceInfo(body: RepairWriteDto): Observable<unknown> {
		return this.http.put<unknown>(`${this.baseUrl}/updateDeviceInfo`, body)
	}

	public updateTrackingInfo(body: UpdateTrackingInfoRequest): Observable<unknown[]> {
		return this.http.put<unknown[]>(`${this.baseUrl}/updateTrackingInfo`, body)
	}

	public delete(id: number): Observable<DeleteRepairResponse> {
		return this.http.delete<DeleteRepairResponse>(`${this.baseUrl}/remove/${id}`)
	}

	public getStatuses(): Observable<RepairStatusDto[]> {
		return this.http.get<RepairStatusDto[]>(`${this.baseUrl}/getStatusData`)
	}
}
