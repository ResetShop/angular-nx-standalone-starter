import { inject } from '@angular/core';
import { Auth } from '@providers/auth/auth';

export function initializeAuth() {
	return () => {
		const auth = inject(Auth);
		auth.retrieveFromStorage();
	};
}
