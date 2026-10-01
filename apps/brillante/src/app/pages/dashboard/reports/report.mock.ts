import { makeEnvironmentProviders } from '@angular/core'
import type { CashReportRequest, CashReportTransactionDto } from '@contracts/report/cash-report.types'
import { type Observable, of, throwError } from 'rxjs'
import type { ReportApi } from './report.interface'
import { ReportApi as ReportApiToken } from './report.interface'

export class InMemoryReportApi implements ReportApi {
	private transactions: CashReportTransactionDto[] = []
	private errors = new Map<string, Error>()

	/** The request received by the latest `getCashTransactions` call. */
	public lastRequest: CashReportRequest | null = null

	public setError(method: keyof ReportApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public seed(transactions: CashReportTransactionDto[]): void {
		this.transactions = [...transactions]
	}

	public getCashTransactions(request: CashReportRequest): Observable<CashReportTransactionDto[]> {
		this.lastRequest = request
		const error = this.errors.get('getCashTransactions')
		return error ? throwError(() => error) : of([...this.transactions])
	}
}

export function createMockCashReportTransaction(
	overrides: Partial<CashReportTransactionDto> = {},
): CashReportTransactionDto {
	return {
		id: 1,
		concept: {
			id: 10,
			description: 'Repairs',
			transactionType: { id: 1, description: 'Ingreso' },
			parent: { id: 2, description: 'Services' },
		},
		amount: '1500.50',
		date: '2026-03-10T14:30:00.000Z',
		note: null,
		paymentMethod: { id: 1, description: 'Efectivo' },
		officeBranch: { id: 1, name: 'Centro' },
		audit: { createdBy: { userName: 'clerk' } },
		...overrides,
	}
}

export function provideReportMock(api: InMemoryReportApi = new InMemoryReportApi()) {
	return makeEnvironmentProviders([{ provide: ReportApiToken, useValue: api }])
}
