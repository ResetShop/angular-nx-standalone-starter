import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { SaveTransactionConceptRequest, TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import type { Observable } from 'rxjs'
import { environment } from '../../environments/environment'
import type { CashConceptApi } from './cash-concept.interface'

@Injectable({ providedIn: 'root' })
export class HttpCashConceptApi implements CashConceptApi {
	private readonly http = inject(HttpClient)

	public getAll(): Observable<TransactionConceptDto[]> {
		return this.http.get<TransactionConceptDto[]>(`${environment.apiUrl}/cash/transaction/get`)
	}

	public create(concept: SaveTransactionConceptRequest): Observable<TransactionConceptDto> {
		return this.http.post<TransactionConceptDto>(`${environment.apiUrl}/cash/transaction/create`, { concept })
	}

	public update(concept: SaveTransactionConceptRequest): Observable<number[]> {
		return this.http.put<number[]>(`${environment.apiUrl}/cash/transaction/update`, { concept })
	}

	public enable(concept: SaveTransactionConceptRequest): Observable<number[]> {
		return this.http.put<number[]>(`${environment.apiUrl}/cash/transaction/enable`, { concept })
	}

	public disable(concept: SaveTransactionConceptRequest): Observable<number[]> {
		return this.http.put<number[]>(`${environment.apiUrl}/cash/transaction/disable`, { concept })
	}
}
