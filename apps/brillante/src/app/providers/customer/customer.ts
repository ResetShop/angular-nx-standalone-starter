import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type {
	CreateCustomerRequest,
	CreateCustomerResponse,
	CustomerDto,
	UpdateCustomerRequest,
} from '@contracts/client/client.types'
import type { PaginatedRows } from '@contracts/common/legacy-pagination.types'
import type { Observable } from 'rxjs'
import { environment } from '../../environments/environment'
import type { CustomerApi } from './customer.interface'

@Injectable({ providedIn: 'root' })
export class HttpCustomerApi implements CustomerApi {
	private readonly http = inject(HttpClient)

	public getAll(offset: number, limit: number): Observable<PaginatedRows<CustomerDto>> {
		return this.http.get<PaginatedRows<CustomerDto>>(`${environment.apiUrl}/client/getAll/${offset}/${limit}`)
	}

	public getById(id: number): Observable<CustomerDto> {
		return this.http.get<CustomerDto>(`${environment.apiUrl}/client/getById/${id}`)
	}

	public getByEmail(email: string): Observable<CustomerDto | null> {
		return this.http.get<CustomerDto | null>(`${environment.apiUrl}/client/getByEmail/${encodeURIComponent(email)}`)
	}

	public getByDni(dni: number): Observable<CustomerDto | null> {
		return this.http.get<CustomerDto | null>(`${environment.apiUrl}/client/getByDni/${dni}`)
	}

	public create(body: CreateCustomerRequest): Observable<CreateCustomerResponse> {
		return this.http.post<CreateCustomerResponse>(`${environment.apiUrl}/client/create`, body)
	}

	public update(body: UpdateCustomerRequest): Observable<[number]> {
		return this.http.put<[number]>(`${environment.apiUrl}/client/update`, body)
	}
}
