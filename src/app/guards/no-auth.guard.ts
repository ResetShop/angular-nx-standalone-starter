import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { filter, map, take } from 'rxjs';

export const noAuthGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const router = inject(Router);

	// If auth is not initialized yet, defer the guard decision until initialization is complete
	if (!authStore.isInitialized()) {
		return toObservable(authStore.isInitialized).pipe(
			filter((isInitialized) => isInitialized),
			take(1),
			map(() => {
				const result = authStore.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
				authStore.setGuardValidated(true);
				return result;
			}),
		);
	}

	const result = authStore.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
	authStore.setGuardValidated(true);
	return result;
};
