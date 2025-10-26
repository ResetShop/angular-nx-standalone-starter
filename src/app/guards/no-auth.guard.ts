import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@providers/auth/auth';

export const noAuthGuard: CanActivateFn = () => {
	const auth = inject(Auth);
	const router = inject(Router);

	if (auth.isAuthenticated()) {
		return router.createUrlTree(['/dashboard']);
	}

	return true;
};
