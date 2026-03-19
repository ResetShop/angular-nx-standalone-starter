import type { EnvironmentProviders } from '@angular/core'
import { makeEnvironmentProviders } from '@angular/core'
import { DEFAULT_NOTIFICATION_DURATION } from '@store/ui/ui.constants'
import { parseDurationToMs } from '@utils/duration'
import { provideToastConfig } from 'ng-primitives/toast'

/**
 * Provides the default toast configuration for the app, abstracting away
 * the config object creation and injection.
 */
export function provideToast(): EnvironmentProviders {
	return makeEnvironmentProviders(
		provideToastConfig({
			placement: 'bottom-center',
			duration: parseDurationToMs(DEFAULT_NOTIFICATION_DURATION),
			dismissible: true,
			maxToasts: 3,
			gap: 16,
			zIndex: 9999,
		}),
	)
}
