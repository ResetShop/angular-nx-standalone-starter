import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { catchError, map, of } from 'rxjs';

export const noAuthGuard: CanActivateFn = () => {
	const authStore = inject(AuthStore);
	const router = inject(Router);
	const dashboardUrl = router.createUrlTree(['/dashboard']);

	return authStore.validateSession().pipe(
		map(() => dashboardUrl as typeof dashboardUrl | boolean),
		catchError(() => of(true as typeof dashboardUrl | boolean)),
	);
};
