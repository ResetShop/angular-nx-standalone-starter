import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Auth } from '@providers/auth/auth';

export const noAuthGuard: CanActivateFn = () => {
	const auth = inject(Auth);
	const router = inject(Router);

	// If auth is not initialized yet, defer the guard decision until initialization is complete
	if (!auth.isInitialized()) {
		return new Promise<boolean | UrlTree>((resolve) => {
			const checkAuth = () => {
				if (auth.isInitialized()) {
					const result = auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
					auth.isGuardValidated.set(true);
					resolve(result);
				} else {
					setTimeout(checkAuth, 50);
				}
			};
			checkAuth();
		});
	}

	const result = auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
	auth.isGuardValidated.set(true);
	return result;
};
