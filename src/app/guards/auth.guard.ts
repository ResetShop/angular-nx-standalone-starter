import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const router = inject(Router);

	if (authStore.isInitialized()) {
		return authStore.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
	}

	return toObservable(authStore.isInitialized).pipe(
		filter(Boolean),
		take(1),
		map(() => (authStore.isAuthenticated() ? true : router.createUrlTree(['/auth/login']))),
	);
};
