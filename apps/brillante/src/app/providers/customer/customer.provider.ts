import { makeEnvironmentProviders } from '@angular/core'
import { HttpCustomerApi } from './customer'
import { CustomerApi } from './customer.interface'

export function provideCustomer() {
	return makeEnvironmentProviders([{ provide: CustomerApi, useExisting: HttpCustomerApi }])
}
