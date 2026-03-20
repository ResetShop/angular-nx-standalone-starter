import { makeEnvironmentProviders } from '@angular/core'
import { navigationInputConfig } from '@configs/navigation.config'
import { resolveNavigationConfig } from '@configs/navigation.resolver'
import { NAVIGATION_CONFIG } from '@interfaces/navigation'
import { Navigation } from './navigation'

export function provideNavigation() {
	return makeEnvironmentProviders([
		Navigation,
		{ provide: NAVIGATION_CONFIG, useValue: resolveNavigationConfig(navigationInputConfig) },
	])
}
