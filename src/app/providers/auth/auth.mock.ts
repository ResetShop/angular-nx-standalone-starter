import type { Provider } from '@angular/core'
import { fn } from '@test-utils'
import type { AuthApi } from './auth.interface'
import { AuthApi as AuthApiToken } from './auth.interface'

/**
 * Create a mock AuthApi for tests.
 * Shared across guard and store specs.
 */
export function createAuthApiMock(): Record<keyof AuthApi, ReturnType<typeof fn>> {
	return {
		login: fn(),
		logout: fn(),
		refreshToken: fn(),
		getMe: fn(),
	}
}

export const provideAuthMock = (mock = createAuthApiMock()): Provider[] => [{ provide: AuthApiToken, useValue: mock }]
