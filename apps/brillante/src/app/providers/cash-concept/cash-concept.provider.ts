import { makeEnvironmentProviders } from '@angular/core'
import { HttpCashConceptApi } from './cash-concept'
import { CashConceptApi } from './cash-concept.interface'

export function provideCashConcept() {
	return makeEnvironmentProviders([{ provide: CashConceptApi, useExisting: HttpCashConceptApi }])
}
