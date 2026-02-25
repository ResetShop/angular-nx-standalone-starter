import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router, type UrlTree } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const router = inject(Router);
	const loginUrl = router.createUrlTree(['/auth/login']);

	return authStore.validateSession().pipe(
		map((): boolean | UrlTree => true),
		catchError(() => of(loginUrl)),
	);
};
