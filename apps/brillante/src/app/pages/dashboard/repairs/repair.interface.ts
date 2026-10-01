import { InjectionToken } from '@angular/core'
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
import type { Observable } from 'rxjs'

export interface RepairApi {
	getAll(showFinished: boolean): Observable<RepairDto[]>
	getAllByDate(params: RepairsByDateParams): Observable<RepairDto[]>
	getById(id: number): Observable<RepairDto>
	getHistory(id: number): Observable<RepairStatusHistoryDto[]>
	getByClientId(clientId: number): Observable<RepairDto[]>
	create(body: CreateRepairRequest): Observable<CreateRepairResponse>
	/** Answers with a truthy value when the device info was stored. */
	updateDeviceInfo(body: RepairWriteDto): Observable<unknown>
	/** Answers with a `[result]` tuple whose first element is truthy when the tracking was stored. */
	updateTrackingInfo(body: UpdateTrackingInfoRequest): Observable<unknown[]>
	delete(id: number): Observable<DeleteRepairResponse>
	getStatuses(): Observable<RepairStatusDto[]>
}

export const RepairApi = new InjectionToken<RepairApi>('RepairApi')
