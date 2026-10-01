import { InjectionToken } from '@angular/core'
import type { CashReportRequest, CashReportTransactionDto } from '@contracts/report/cash-report.types'
import type { Observable } from 'rxjs'

/**
 * Read-only access to the data the reports are computed from.
 */
export interface ReportApi {
	/** Cash transactions of the period, optionally restricted to a single branch. */
	getCashTransactions(request: CashReportRequest): Observable<CashReportTransactionDto[]>
}

export const ReportApi = new InjectionToken<ReportApi>('ReportApi')
