import { makeEnvironmentProviders } from '@angular/core'
import type {
	CreateCustomerRequest,
	CreateCustomerResponse,
	CustomerDto,
	UpdateCustomerRequest,
} from '@contracts/client/client.types'
import type { PaginatedRows } from '@contracts/common/pagination.types'
import { type Observable, of, throwError } from 'rxjs'
import type { CustomerApi } from './customer.interface'
import { CustomerApi as CustomerApiToken } from './customer.interface'

export class InMemoryCustomerApi implements CustomerApi {
	private customers: CustomerDto[] = []
	private nextId = 1
	private errors = new Map<string, Error>()

	public setError(method: keyof CustomerApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public seed(customers: CustomerDto[]): void {
		this.customers = [...customers]
		this.nextId = Math.max(0, ...customers.map((customer) => customer.id ?? 0)) + 1
	}

	public getAll(offset: number, limit: number): Observable<PaginatedRows<CustomerDto>> {
		const error = this.errors.get('getAll')
		if (error) return throwError(() => error)
		return of({ count: this.customers.length, rows: this.customers.slice(offset, offset + limit) })
	}

	public getById(id: number): Observable<CustomerDto> {
		const error = this.errors.get('getById')
		if (error) return throwError(() => error)
		const found = this.customers.find((customer) => customer.id === id)
		return found ? of(found) : throwError(() => new Error(`Customer ${id} not found`))
	}

	public getByEmail(email: string): Observable<CustomerDto | null> {
		const error = this.errors.get('getByEmail')
		if (error) return throwError(() => error)
		return of(this.customers.find((customer) => customer.email === email) ?? null)
	}

	public getByDni(dni: number): Observable<CustomerDto | null> {
		const error = this.errors.get('getByDni')
		if (error) return throwError(() => error)
		return of(this.customers.find((customer) => customer.dni === dni) ?? null)
	}

	public create(body: CreateCustomerRequest): Observable<CreateCustomerResponse> {
		const error = this.errors.get('create')
		if (error) return throwError(() => error)
		const existing = this.customers.find((customer) => customer.dni === body.dni)
		if (existing) return of([existing, false])
		const created = { id: this.nextId++, ...body }
		this.customers = [...this.customers, created]
		return of([created, true])
	}

	public update(body: UpdateCustomerRequest): Observable<[number]> {
		const error = this.errors.get('update')
		if (error) return throwError(() => error)
		this.customers = this.customers.map((customer) => (customer.id === body.id ? body : customer))
		return of([1])
	}
}

export function provideCustomerMock(api: InMemoryCustomerApi = new InMemoryCustomerApi()) {
	return makeEnvironmentProviders([{ provide: CustomerApiToken, useValue: api }])
}
