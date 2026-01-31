import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { filter, map, take } from 'rxjs';

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
		return toObservable(authStore.isInitialized).pipe(
			filter((isInitialized) => isInitialized),
			take(1),
			map(() => {
				const result = !authStore.isAuthenticated() ? router.createUrlTree(['/auth/login']) : true;
				authStore.setGuardValidated(true);
				return result;
			}),
		);
	}

	const result = !authStore.isAuthenticated() ? router.createUrlTree(['/auth/login']) : true;
	authStore.setGuardValidated(true);
	return result;
};
