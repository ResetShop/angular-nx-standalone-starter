import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import type { Observable } from 'rxjs'
import { environment } from '../../environments/environment'
import type { PaymentMethodApi } from './payment-method.interface'

@Injectable({ providedIn: 'root' })
export class HttpPaymentMethodApi implements PaymentMethodApi {
	private readonly http = inject(HttpClient)

	public getAll(): Observable<PaymentMethodDto[]> {
		return this.http.get<PaymentMethodDto[]>(`${environment.apiUrl}/cash/getPaymentMethods`)
	}
}
