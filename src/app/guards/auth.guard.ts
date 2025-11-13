import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Auth } from '@providers/auth/auth';

export const authGuard: CanActivateFn = () => {
	const platformId = inject(PLATFORM_ID);
	const auth = inject(Auth);
	const router = inject(Router);

	// On the server, allow the route to be rendered
	// The client will handle the actual auth check after hydration
	if (isPlatformServer(platformId)) {
		return true;
	}

	// If auth is not initialized yet, defer the guard decision until initialization is complete
	if (!auth.isInitialized()) {
		return new Promise<boolean | UrlTree>((resolve) => {
			const checkAuth = () => {
				if (auth.isInitialized()) {
					const result = !auth.isAuthenticated() ? router.createUrlTree(['/auth/login']) : true;
					auth.isGuardValidated.set(true);
					resolve(result);
				} else {
					setTimeout(checkAuth, 50);
				}
			};
			checkAuth();
		});
	}

	const result = !auth.isAuthenticated() ? router.createUrlTree(['/auth/login']) : true;
	auth.isGuardValidated.set(true);
	return result;
};
