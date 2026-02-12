import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';

export const authGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const router = inject(Router);

	if (!authStore.isInitialized()) {
		authStore.restoreFromStorage();
	}

	const result = !authStore.isAuthenticated() ? router.createUrlTree(['/auth/login']) : true;
	authStore.setGuardValidated(true);
	return result;
};
