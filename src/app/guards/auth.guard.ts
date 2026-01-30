import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';

export const authGuard: CanActivateFn = () => {
	const platformId = inject(PLATFORM_ID);
	const authStore = inject(AuthStore);
	const router = inject(Router);

	// On the server, allow the route to be rendered
	// The client will handle the actual auth check after hydration
	if (isPlatformServer(platformId)) {
		return true;
	}

	// If auth is not initialized yet, defer the guard decision until initialization is complete
	if (!authStore.isInitialized()) {
		return new Promise<boolean | UrlTree>((resolve) => {
			const checkAuth = () => {
				if (authStore.isInitialized()) {
					const result = !authStore.isAuthenticated() ? router.createUrlTree(['/auth/login']) : true;
					authStore.setGuardValidated(true);
					resolve(result);
				} else {
					setTimeout(checkAuth, 50);
				}
			};
			checkAuth();
		});
	}

	const result = !authStore.isAuthenticated() ? router.createUrlTree(['/auth/login']) : true;
	authStore.setGuardValidated(true);
	return result;
};
