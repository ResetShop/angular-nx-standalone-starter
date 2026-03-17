import type { Provider } from '@angular/core'
import { HttpPermissionsApi } from './permissions'
import { PermissionsApi } from './permissions.interface'

export function providePermissions(): Provider[] {
	return [{ provide: PermissionsApi, useExisting: HttpPermissionsApi }]
}
