import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import {
	ApplicationConfig,
	inject,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
} from '@angular/core'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideClientHydration, withEventReplay } from '@angular/platform-browser'
import { provideRouter, TitleStrategy, withViewTransitions } from '@angular/router'
import { Analytics } from '@providers/analytics/analytics'
import { provideAuth } from '@providers/auth/auth.provider'
import { initializeTranslation } from '@providers/i18n/translation.initializer'
import { NavigationTitleStrategy } from '@providers/navigation/navigation-title.strategy'
import { provideNavigation } from '@providers/navigation/navigation.provider'
import { provideProjectConfig } from '@providers/project/project.provider'
import { provideTheme } from '@providers/theme/theme'
import { UIStore } from '@store/ui/ui.store'
import { appRoutes } from './app.routes'
import { environment } from './environments/environment'
import { authInterceptor } from './interceptors/auth.interceptor'
import { forbiddenInterceptor } from './interceptors/forbidden.interceptor'
import { tokenRefreshInterceptor } from './interceptors/token-refresh.interceptor'

function initializeAnalytics() {
	return async () => {
		if (environment.environment !== 'production') {
			return
		}

		const analytics = inject(Analytics)
		await analytics.init()
	}
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideClientHydration(withEventReplay()),
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(appRoutes, withViewTransitions()),
		provideHttpClient(withFetch(), withInterceptors([authInterceptor, tokenRefreshInterceptor, forbiddenInterceptor])),

		// Initializers
		provideAppInitializer(initializeAnalytics()),
		provideAppInitializer(initializeTranslation()),

		// Signal forms
		...provideSignalFormsConfig({}),

		// Custom providers
		Analytics,
		UIStore,
		provideTheme(),
		provideNavigation(),
		provideProjectConfig(),
		{ provide: TitleStrategy, useClass: NavigationTitleStrategy },

		// API providers
		provideAuth(),
	],
}
