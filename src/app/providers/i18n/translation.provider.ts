import { makeEnvironmentProviders } from '@angular/core'
import { Translation } from './translation'

export function provideTranslation() {
	return makeEnvironmentProviders([Translation])
}
