import { makeEnvironmentProviders } from '@angular/core'
import { HttpPaymentMethodApi } from './payment-method'
import { PaymentMethodApi } from './payment-method.interface'

export function providePaymentMethod() {
	return makeEnvironmentProviders([{ provide: PaymentMethodApi, useExisting: HttpPaymentMethodApi }])
}
