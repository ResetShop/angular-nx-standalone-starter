import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { catchError, filter, map, of, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const router = inject(Router);

	if (authStore.isInitialized()) {
		return authStore.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
	}

	// Safety net — APP_INITIALIZER guarantees isInitialized before routing,
	// but this handles edge cases where the signal hasn't propagated yet.
	return toObservable(authStore.isInitialized).pipe(
		filter(Boolean),
		take(1),
		map(() => (authStore.isAuthenticated() ? true : router.createUrlTree(['/auth/login']))),
		catchError((error) => {
			console.error('[AuthGuard] Unexpected initialization failure during routing:', error);
			return of(router.createUrlTree(['/auth/login']));
		}),
	);
};
