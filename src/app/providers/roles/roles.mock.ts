import type { Provider } from '@angular/core'
import { fn } from '@test-utils'
import type { RolesApi } from './roles.interface'
import { RolesApi as RolesApiToken } from './roles.interface'

/**
 * Create a mock RolesApi for tests.
 */
export function createRolesApiMock(): Record<keyof RolesApi, ReturnType<typeof fn>> {
	return {
		getAll: fn(),
		getAllUnpaginated: fn(),
		getByIdWithPermissions: fn(),
		create: fn(),
		update: fn(),
		delete: fn(),
		assignPermissions: fn(),
	}
}

export const provideRolesMock = (mock = createRolesApiMock()): Provider[] => [
	{ provide: RolesApiToken, useValue: mock },
]
