import { inject } from '@angular/core';
import { AuthStore } from '@store/auth/auth.store';

export function initializeAuth() {
	return () => {
		const authStore = inject(AuthStore);
		authStore.restoreFromStorage();
	};
}
