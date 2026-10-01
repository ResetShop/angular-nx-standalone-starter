import { InjectionToken } from '@angular/core'
import type {
	CreateCustomerRequest,
	CreateCustomerResponse,
	CustomerDto,
	UpdateCustomerRequest,
} from '@contracts/client/client.types'
import type { PaginatedRows } from '@contracts/common/pagination.types'
import type { Observable } from 'rxjs'

export interface CustomerApi {
	getAll(offset: number, limit: number): Observable<PaginatedRows<CustomerDto>>
	getById(id: number): Observable<CustomerDto>
	getByEmail(email: string): Observable<CustomerDto | null>
	getByDni(dni: number): Observable<CustomerDto | null>
	create(body: CreateCustomerRequest): Observable<CreateCustomerResponse>
	update(body: UpdateCustomerRequest): Observable<[number]>
}

export const CustomerApi = new InjectionToken<CustomerApi>('CustomerApi')
