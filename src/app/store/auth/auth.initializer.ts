import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from './auth.store';

/**
 * APP_INITIALIZER factory for authentication.
 *
 * Blocks app bootstrap until the auth session is resolved. This guarantees
 * that `AuthStore.isInitialized()` is `true` before the router evaluates
 * any guards, allowing guards to check auth state synchronously.
 *
 * Calls `AuthStore.initialize()` which hits `GET /api/auth/me`:
 * - On success: `currentUser` is set from the response.
 * - On failure (401/network): `currentUser` is set to `null`.
 *
 * Works on both platforms — during SSR the `ssrCookieInterceptor` forwards
 * cookies from the original browser request to the outgoing API call.
 */
export function initializeAuth() {
	return async () => {
		const authStore = inject(AuthStore);
		await firstValueFrom(authStore.initialize());
	};
}
