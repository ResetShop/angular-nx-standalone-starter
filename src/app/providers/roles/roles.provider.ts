import type { Provider } from '@angular/core'
import { HttpRolesApi } from './roles'
import { RolesApi } from './roles.interface'

export function provideRoles(): Provider[] {
	return [{ provide: RolesApi, useExisting: HttpRolesApi }]
}
