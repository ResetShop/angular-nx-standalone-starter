import { makeEnvironmentProviders } from '@angular/core'
import { HttpUserApi } from './user'
import { UserApi } from './user.interface'

export function provideUser() {
	return makeEnvironmentProviders([{ provide: UserApi, useExisting: HttpUserApi }])
}
