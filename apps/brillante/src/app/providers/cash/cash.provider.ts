import { makeEnvironmentProviders } from '@angular/core'
import { HttpCashApi } from './cash'
import { CashApi } from './cash.interface'

export function provideCash() {
	return makeEnvironmentProviders([{ provide: CashApi, useExisting: HttpCashApi }])
}
