import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { CashReportRequest, CashReportTransactionDto } from '@contracts/report/cash-report.types'
import type { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { ReportApi } from './report.interface'

@Injectable({ providedIn: 'root' })
export class HttpReportApi implements ReportApi {
	private readonly http = inject(HttpClient)

	public getCashTransactions(request: CashReportRequest): Observable<CashReportTransactionDto[]> {
		let params = new HttpParams()
			.set('startDate', `${request.startDate} 00:00:00`)
			.set('endDate', `${request.endDate} 23:59:59`)

		if (request.branchId !== undefined) {
			params = params.set('idBranch', `${request.branchId}`)
		}

		return this.http.get<CashReportTransactionDto[]>(`${environment.apiUrl}/cash`, { params })
	}
}
