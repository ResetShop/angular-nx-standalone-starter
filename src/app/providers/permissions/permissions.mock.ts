import type { Provider } from '@angular/core'
import { fn } from '@test-utils'
import type { PermissionsApi } from './permissions.interface'
import { PermissionsApi as PermissionsApiToken } from './permissions.interface'

/**
 * Create a mock PermissionsApi for tests.
 */
export function createPermissionsApiMock(): Record<keyof PermissionsApi, ReturnType<typeof fn>> {
	return {
		getAllUnpaginated: fn(),
	}
}

export const providePermissionsMock = (mock = createPermissionsApiMock()): Provider[] => [
	{ provide: PermissionsApiToken, useValue: mock },
]
