import type { Provider } from '@angular/core'
import { fn } from '@test-utils'
import type { UsersApi } from './users.interface'
import { UsersApi as UsersApiToken } from './users.interface'

/**
 * Create a mock UsersApi for tests.
 */
export function createUsersApiMock(): Record<keyof UsersApi, ReturnType<typeof fn>> {
	return {
		getAll: fn(),
		getById: fn(),
		create: fn(),
		update: fn(),
		delete: fn(),
		updateStatus: fn(),
	}
}

export const provideUsersMock = (mock = createUsersApiMock()): Provider[] => [
	{ provide: UsersApiToken, useValue: mock },
]
