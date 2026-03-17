import type { Provider } from '@angular/core'
import { HttpAuthApi } from './auth'
import { AuthApi } from './auth.interface'

/**
 * Provides auth-related services.
 * Maps the AuthApi token to the HttpAuthApi implementation.
 */
export function provideAuth(): Provider[] {
	return [{ provide: AuthApi, useExisting: HttpAuthApi }]
}
