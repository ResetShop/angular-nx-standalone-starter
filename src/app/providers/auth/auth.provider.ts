import { makeEnvironmentProviders } from '@angular/core'
import { HttpAuthApi } from './auth'
import { AuthApi } from './auth.interface'

export function provideAuth() {
	return makeEnvironmentProviders([{ provide: AuthApi, useExisting: HttpAuthApi }])
}
