import { InjectionToken } from '@angular/core'
import type { SaveTransactionConceptRequest, TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import type { Observable } from 'rxjs'

export interface CashConceptApi {
	/** Returns the whole concept tree: root concepts carry their `children`. */
	getAll(): Observable<TransactionConceptDto[]>
	create(concept: SaveTransactionConceptRequest): Observable<TransactionConceptDto>
	update(concept: SaveTransactionConceptRequest): Observable<number[]>
	enable(concept: SaveTransactionConceptRequest): Observable<number[]>
	disable(concept: SaveTransactionConceptRequest): Observable<number[]>
}

export const CashConceptApi = new InjectionToken<CashConceptApi>('CashConceptApi')
