import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';

export const noAuthGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const router = inject(Router);

	// If auth is not initialized yet, defer the guard decision until initialization is complete
	if (!authStore.isInitialized()) {
		return new Promise<boolean | UrlTree>((resolve) => {
			const checkAuth = () => {
				if (authStore.isInitialized()) {
					const result = authStore.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
					authStore.setGuardValidated(true);
					resolve(result);
				} else {
					setTimeout(checkAuth, 50);
				}
			};
			checkAuth();
		});
	}

	const result = authStore.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
	authStore.setGuardValidated(true);
	return result;
};
