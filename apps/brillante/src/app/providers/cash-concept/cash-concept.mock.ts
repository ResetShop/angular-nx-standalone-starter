import { makeEnvironmentProviders } from '@angular/core'
import type { SaveTransactionConceptRequest, TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import { type Observable, of, throwError } from 'rxjs'
import type { CashConceptApi } from './cash-concept.interface'
import { CashConceptApi as CashConceptApiToken } from './cash-concept.interface'

export class InMemoryCashConceptApi implements CashConceptApi {
	private concepts: TransactionConceptDto[] = []
	private nextId = 1
	private errors = new Map<string, Error>()

	public setError(method: keyof CashConceptApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public seed(concepts: TransactionConceptDto[]): void {
		this.concepts = [...concepts]
		this.nextId = Math.max(0, ...concepts.map((concept) => concept.id)) + 1
	}

	public getAll(): Observable<TransactionConceptDto[]> {
		const error = this.errors.get('getAll')
		return error ? throwError(() => error) : of([...this.concepts])
	}

	public create(concept: SaveTransactionConceptRequest): Observable<TransactionConceptDto> {
		const error = this.errors.get('create')
		if (error) return throwError(() => error)
		const created = {
			id: this.nextId++,
			transactionType: { id: 1, description: 'Ingreso' },
			parent: null,
			children: [],
			userAssignable: true,
			enabled: true,
			modifiable: true,
			...concept,
		}
		this.concepts = [...this.concepts, created]
		return of(created)
	}

	public update(concept: SaveTransactionConceptRequest): Observable<number[]> {
		return this.mutate('update', concept, (current) => ({ ...current, ...concept }))
	}

	public enable(concept: SaveTransactionConceptRequest): Observable<number[]> {
		return this.mutate('enable', concept, (current) => ({ ...current, enabled: true }))
	}

	public disable(concept: SaveTransactionConceptRequest): Observable<number[]> {
		return this.mutate('disable', concept, (current) => ({ ...current, enabled: false }))
	}

	private mutate(
		method: keyof CashConceptApi,
		concept: SaveTransactionConceptRequest,
		change: (current: TransactionConceptDto) => TransactionConceptDto,
	): Observable<number[]> {
		const error = this.errors.get(method)
		if (error) return throwError(() => error)
		this.concepts = this.concepts.map((current) => (current.id === concept.id ? change(current) : current))
		return of([1])
	}
}

export function provideCashConceptMock(api: InMemoryCashConceptApi = new InMemoryCashConceptApi()) {
	return makeEnvironmentProviders([{ provide: CashConceptApiToken, useValue: api }])
}
