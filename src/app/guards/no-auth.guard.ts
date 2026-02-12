import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';

export const noAuthGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const router = inject(Router);

	if (!authStore.isInitialized()) {
		authStore.restoreFromStorage();
	}

	return authStore.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
