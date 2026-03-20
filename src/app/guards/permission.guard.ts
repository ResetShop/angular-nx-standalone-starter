import { inject } from '@angular/core'
import type { CanActivateFn } from '@angular/router'
import { Router } from '@angular/router'
import { AuthStore } from '@store/auth/auth.store'

/**
 * Route guard that checks if the current user has the permission specified
 * in `route.data['requiredPermission']`. Redirects to /dashboard if denied.
 *
 * This guard is synchronous — it relies on `authGuard` (on the parent route)
 * having already validated the session and populated `currentUser()`.
 */
export const permissionGuard: CanActivateFn = (route) => {
	const authStore = inject(AuthStore)
	const router = inject(Router)
	const requiredPermission = route.data['requiredPermission'] as string | undefined

	if (!requiredPermission) {
		return true
	}

	const user = authStore.currentUser()
	if (user?.hasPermission(requiredPermission)) {
		return true
	}

	return router.createUrlTree(['/dashboard'])
}
