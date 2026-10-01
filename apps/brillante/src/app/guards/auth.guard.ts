import { inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import type { CanActivateFn } from '@angular/router'
import { Router } from '@angular/router'
import { AuthStore } from '@store/auth/auth.store'
import { filter, map, take } from 'rxjs'

/**
 * Lets the navigation through when a Brillante session exists. Otherwise it asks the store to
 * resolve the Auth0 session (which also completes the redirect callback after a login) and
 * waits for the outcome, sending the user to the login page when there is none.
 */
export const authGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore)
	const router = inject(Router)
	const loginUrl = router.createUrlTree(['/auth/login'])

	if (authStore.currentUser()) {
		return true
	}

	authStore.login()

	return toObservable(authStore.isLoggingIn).pipe(
		filter((isLoggingIn) => !isLoggingIn),
		take(1),
		map(() => (authStore.currentUser() ? true : loginUrl)),
	)
}
