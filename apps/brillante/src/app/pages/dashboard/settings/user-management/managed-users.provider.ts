import { makeEnvironmentProviders } from '@angular/core'
import { HttpManagedUsersApi } from './managed-users'
import { ManagedUsersApi } from './managed-users.interface'

export function provideManagedUsers() {
	return makeEnvironmentProviders([{ provide: ManagedUsersApi, useExisting: HttpManagedUsersApi }])
}
