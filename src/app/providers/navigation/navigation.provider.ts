import { Provider } from '@angular/core';
import { Navigation } from './navigation';
import { NAVIGATION_CONFIG } from '@interfaces/navigation';
import { navigationConfig } from './navigation.config';

export function provideNavigation(): Provider[] {
	return [Navigation, { provide: NAVIGATION_CONFIG, useValue: navigationConfig }];
}
