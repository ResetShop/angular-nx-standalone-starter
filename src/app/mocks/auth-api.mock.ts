import { fn } from '@test-utils'

/**
 * Create a mock AuthApi for tests.
 * Shared across guard and store specs.
 */
export function createAuthApiMock() {
	return {
		login: fn(),
		logout: fn(),
		refreshToken: fn(),
		getMe: fn(),
	}
}
