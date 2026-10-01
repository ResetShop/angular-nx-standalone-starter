import { InjectionToken } from '@angular/core'
import type {
	CashActorDto,
	CashTransactionDto,
	CashTransactionQuery,
	CashTransactionRequest,
} from '@contracts/cash/cash-transaction.types'
import type { OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import type { Observable } from 'rxjs'

export interface CashApi {
	/** Transactions of the day range, optionally limited to one branch. */
	getAll(query: CashTransactionQuery): Observable<CashTransactionDto[]>
	getById(id: number): Observable<CashTransactionDto>
	/** The API answers with the created transaction wrapped in an array. */
	create(
		transaction: CashTransactionRequest,
		user: CashActorDto,
		branch: OfficeBranchDto,
	): Observable<CashTransactionDto[]>
	/** Resolves with the affected-row count, as reported by the API. */
	update(transaction: CashTransactionRequest, user: CashActorDto): Observable<number[]>
	remove(id: number): Observable<unknown>
	/** Opens the cash register of the branch for the current day. */
	open(user: CashActorDto, branch: OfficeBranchDto): Observable<CashTransactionDto>
	close(branch: OfficeBranchDto): Observable<unknown>
}

export const CashApi = new InjectionToken<CashApi>('CashApi')
