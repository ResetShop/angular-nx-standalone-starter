import { Provider } from '@angular/core';
import { AuthApiService } from '@providers/auth/auth';

/**
 * Provides auth-related services
 * Note: AuthStore is providedIn: 'root' so doesn't need explicit provider
 */
export function provideAuth(): Provider[] {
	return [AuthApiService];
}
