import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type {
	CashActorDto,
	CashTransactionDto,
	CashTransactionQuery,
	CashTransactionRequest,
} from '@contracts/cash/cash-transaction.types'
import type { OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import { format } from 'date-fns'
import type { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { CashApi } from './cash.interface'

@Injectable({ providedIn: 'root' })
export class HttpCashApi implements CashApi {
	private readonly http = inject(HttpClient)

	public getAll({ from, to, branchId }: CashTransactionQuery): Observable<CashTransactionDto[]> {
		let params = new HttpParams()
			.set('startDate', `${format(from, 'yyyy-MM-dd')} 00:00:00`)
			.set('endDate', `${format(to, 'yyyy-MM-dd')} 23:59:59`)
		if (branchId !== undefined) {
			params = params.set('idBranch', String(branchId))
		}
		return this.http.get<CashTransactionDto[]>(`${environment.apiUrl}/cash`, { params })
	}

	public getById(id: number): Observable<CashTransactionDto> {
		return this.http.get<CashTransactionDto>(`${environment.apiUrl}/cash/getById/${id}`)
	}

	public create(
		transaction: CashTransactionRequest,
		user: CashActorDto,
		branch: OfficeBranchDto,
	): Observable<CashTransactionDto[]> {
		return this.http.post<CashTransactionDto[]>(`${environment.apiUrl}/cash/create`, { ...transaction, user, branch })
	}

	public update(transaction: CashTransactionRequest, user: CashActorDto): Observable<number[]> {
		return this.http.put<number[]>(`${environment.apiUrl}/cash/update`, { transaction, user })
	}

	public remove(id: number): Observable<unknown> {
		return this.http.delete<unknown>(`${environment.apiUrl}/cash/remove/${id}`)
	}

	public open(user: CashActorDto, branch: OfficeBranchDto): Observable<CashTransactionDto> {
		return this.http.post<CashTransactionDto>(`${environment.apiUrl}/cash/open`, { user, branch })
	}

	public close(branch: OfficeBranchDto): Observable<unknown> {
		return this.http.post<unknown>(`${environment.apiUrl}/cash/close`, { branch })
	}
}
