import { InjectionToken } from '@angular/core'
import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import type { Observable } from 'rxjs'

export interface PaymentMethodApi {
	getAll(): Observable<PaymentMethodDto[]>
}

export const PaymentMethodApi = new InjectionToken<PaymentMethodApi>('PaymentMethodApi')
