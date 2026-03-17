import type { Provider } from '@angular/core'
import { HttpUsersApi } from './users'
import { UsersApi } from './users.interface'

export function provideUsers(): Provider[] {
	return [{ provide: UsersApi, useExisting: HttpUsersApi }]
}
