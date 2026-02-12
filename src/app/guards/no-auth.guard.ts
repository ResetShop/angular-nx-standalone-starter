import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { filter, map, take } from 'rxjs';

export const noAuthGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const router = inject(Router);

	if (authStore.isInitialized()) {
		return authStore.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
	}

	return toObservable(authStore.isInitialized).pipe(
		filter(Boolean),
		take(1),
		map(() => (authStore.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true)),
	);
};
