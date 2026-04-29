import { makeEnvironmentProviders } from '@angular/core'
import type { NavigationConfig } from '../interfaces/navigation'
import { NAVIGATION_CONFIG } from '../interfaces/navigation'
import { Navigation } from './navigation'

export function provideNavigation() {
	return makeEnvironmentProviders([Navigation])
}

export function provideNavigationConfig(config: NavigationConfig) {
	return makeEnvironmentProviders([{ provide: NAVIGATION_CONFIG, useValue: config }])
}
