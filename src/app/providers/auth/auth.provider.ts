import { Provider } from '@angular/core';
import { Auth } from '@providers/auth/auth';

export function provideAuth(): Provider[] {
	return [Auth];
}
