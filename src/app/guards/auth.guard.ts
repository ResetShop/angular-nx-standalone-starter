import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@providers/auth/auth';

export const authGuard: CanActivateFn = () => {
	const platformId = inject(PLATFORM_ID);
	const auth = inject(Auth);
	const router = inject(Router);

	// On the server, allow the route to be rendered
	// The client will handle the actual auth check after hydration
	if (isPlatformServer(platformId)) {
		return true;
	}

	if (!auth.isAuthenticated()) {
		return router.createUrlTree(['/auth/login']);
	}

	return true;
};
