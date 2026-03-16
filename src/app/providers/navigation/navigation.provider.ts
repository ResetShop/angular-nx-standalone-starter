import { Provider } from '@angular/core'
import { navigationConfig } from '@configs/navigation.config'
import { NAVIGATION_CONFIG } from '@interfaces/navigation'
import { Navigation } from './navigation'

export function provideNavigation(): Provider[] {
	return [Navigation, { provide: NAVIGATION_CONFIG, useValue: navigationConfig }]
}
