import { makeEnvironmentProviders } from '@angular/core'
import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import { type Observable, of, throwError } from 'rxjs'
import type { PaymentMethodApi } from './payment-method.interface'
import { PaymentMethodApi as PaymentMethodApiToken } from './payment-method.interface'

export class InMemoryPaymentMethodApi implements PaymentMethodApi {
	private paymentMethods: PaymentMethodDto[] = []
	private errors = new Map<string, Error>()

	public setError(method: keyof PaymentMethodApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public seed(paymentMethods: PaymentMethodDto[]): void {
		this.paymentMethods = [...paymentMethods]
	}

	public getAll(): Observable<PaymentMethodDto[]> {
		const error = this.errors.get('getAll')
		return error ? throwError(() => error) : of([...this.paymentMethods])
	}
}

export function providePaymentMethodMock(api: InMemoryPaymentMethodApi = new InMemoryPaymentMethodApi()) {
	return makeEnvironmentProviders([{ provide: PaymentMethodApiToken, useValue: api }])
}
