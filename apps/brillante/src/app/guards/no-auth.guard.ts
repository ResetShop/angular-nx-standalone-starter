import { inject } from '@angular/core'
import type { CanActivateFn } from '@angular/router'
import { Router } from '@angular/router'
import { AuthStore } from '@store/auth/auth.store'

/**
 * Keeps signed-in users away from the login page.
 */
export const noAuthGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore)
	const router = inject(Router)

	return authStore.currentUser() ? router.createUrlTree(['/dashboard']) : true
}
