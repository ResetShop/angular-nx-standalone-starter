import { makeEnvironmentProviders } from '@angular/core'
import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import type {
	CashTransactionDto,
	CashTransactionQuery,
	CashTransactionRequest,
} from '@contracts/cash/cash-transaction.types'
import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import { type Observable, of, throwError } from 'rxjs'
import type { CashApi } from './cash.interface'
import { CashApi as CashApiToken } from './cash.interface'

export function createMockPaymentMethodDto(overrides: Partial<PaymentMethodDto> = {}): PaymentMethodDto {
	return { id: 1, description: 'Efectivo', allowsInstallments: false, installments: [], ...overrides }
}

export function createMockConceptDto(overrides: Partial<TransactionConceptDto> = {}): TransactionConceptDto {
	return {
		id: 11,
		description: 'Venta de accesorios',
		transactionType: { id: 1, description: 'Ingreso' },
		parent: {
			id: 1,
			description: 'Ventas',
			transactionType: { id: 1, description: 'Ingreso' },
			parent: null,
			children: [],
			userAssignable: true,
			enabled: true,
			modifiable: true,
		},
		children: [],
		userAssignable: true,
		enabled: true,
		modifiable: true,
		...overrides,
	}
}

export function createMockCashTransactionDto(overrides: Partial<CashTransactionDto> = {}): CashTransactionDto {
	return {
		id: 1,
		concept: createMockConceptDto(),
		amount: '1500.00',
		date: '2026-03-04T15:30:00.000Z',
		note: 'Venta de mostrador',
		audit: {
			createdAt: '2026-03-04T15:30:00.000Z',
			updatedAt: '2026-03-04T15:31:00.000Z',
			createdBy: {
				id: 5,
				userName: 'clerk',
				firstName: 'Ana',
				lastName: 'Gómez',
				avatar: null,
				email: 'ana@brillante.test',
				roles: [{ id: 3, description: 'Counter clerk' }],
				hasFinishedRegistration: true,
			},
			deleted: false,
			enabled: true,
		},
		operation: null,
		paymentMethod: createMockPaymentMethodDto(),
		payments: [{ amount: '1500.00', paymentMethod: createMockPaymentMethodDto() }],
		...overrides,
	}
}

/**
 * Keeps the transactions in memory. The transaction list is the same whatever the query: specs that
 * care about the filters assert on the arguments they pass to the store instead.
 */
export class InMemoryCashApi implements CashApi {
	private transactions: CashTransactionDto[] = []
	private nextId = 1
	private errors = new Map<string, Error>()

	public readonly queries: CashTransactionQuery[] = []

	public setError(method: keyof CashApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public seed(transactions: CashTransactionDto[]): void {
		this.transactions = [...transactions]
		this.nextId = Math.max(0, ...transactions.map((transaction) => transaction.id)) + 1
	}

	public getAll(query: CashTransactionQuery): Observable<CashTransactionDto[]> {
		this.queries.push(query)
		const error = this.errors.get('getAll')
		return error ? throwError(() => error) : of([...this.transactions])
	}

	public getById(id: number): Observable<CashTransactionDto> {
		const error = this.errors.get('getById')
		if (error) return throwError(() => error)
		const found = this.transactions.find((transaction) => transaction.id === id)
		return found ? of(found) : throwError(() => new Error(`Transaction ${id} not found`))
	}

	public create(transaction: CashTransactionRequest): Observable<CashTransactionDto[]> {
		const error = this.errors.get('create')
		if (error) return throwError(() => error)
		const created = createMockCashTransactionDto({
			id: this.nextId++,
			concept: transaction.concept,
			amount: String(transaction.amount),
			date: transaction.date,
			note: transaction.note,
		})
		this.transactions = [...this.transactions, created]
		return of([created])
	}

	public update(transaction: CashTransactionRequest): Observable<number[]> {
		const error = this.errors.get('update')
		if (error) return throwError(() => error)
		this.transactions = this.transactions.map((current) =>
			current.id === transaction.id
				? { ...current, note: transaction.note, amount: String(transaction.amount), date: transaction.date }
				: current,
		)
		return of([1])
	}

	public remove(id: number): Observable<unknown> {
		const error = this.errors.get('remove')
		if (error) return throwError(() => error)
		this.transactions = this.transactions.filter((transaction) => transaction.id !== id)
		return of({ response: `Deleted transaction with id ${id}` })
	}

	public open(): Observable<CashTransactionDto> {
		const error = this.errors.get('open')
		if (error) return throwError(() => error)
		const opened = createMockCashTransactionDto({ id: this.nextId++, amount: '0.00', note: 'Apertura de caja' })
		this.transactions = [...this.transactions, opened]
		return of(opened)
	}

	public close(): Observable<unknown> {
		const error = this.errors.get('close')
		return error ? throwError(() => error) : of({})
	}
}

export function provideCashMock(api: InMemoryCashApi = new InMemoryCashApi()) {
	return makeEnvironmentProviders([{ provide: CashApiToken, useValue: api }])
}
