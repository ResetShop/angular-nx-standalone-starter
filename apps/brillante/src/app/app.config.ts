import { provideHttpClient, withInterceptors } from '@angular/common/http'
import {
	ApplicationConfig,
	inject,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
} from '@angular/core'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import {
	provideRouter,
	TitleStrategy,
	withExperimentalAutoCleanupInjectors,
	withViewTransitions,
} from '@angular/router'
import { provideOverlayContainers } from '@configs/overlay-container.config'
import { projectConfig } from '@configs/project.config'
import { Analytics } from '@providers/analytics/analytics'
import { provideAuth, withNavigationPermissionCheck } from '@providers/auth/auth.provider'
import { provideIdentity } from '@providers/identity/identity.provider'
import { provideProjectConfig } from '@providers/project/project.provider'
import type { Language } from '@resetshop/angular-core/i18n/translation'
import { initializeTranslation } from '@resetshop/angular-core/i18n/translation.initializer'
import { provideTranslation } from '@resetshop/angular-core/i18n/translation.provider'
import { NavigationTitleStrategy } from '@resetshop/angular-core/navigation/navigation-title.strategy'
import { provideTheme } from '@resetshop/angular-core/theme/theme'
import { UIStore } from '@store/ui/ui.store'
import { appRoutes } from './app.routes'
import { environment } from './environments/environment'
import { forbiddenInterceptor } from './interceptors/forbidden.interceptor'
import { jwtInterceptor } from './interceptors/jwt.interceptor'
import { unauthorizedInterceptor } from './interceptors/unauthorized.interceptor'

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
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(appRoutes, withViewTransitions(), withExperimentalAutoCleanupInjectors()),
		provideHttpClient(withInterceptors([jwtInterceptor, unauthorizedInterceptor, forbiddenInterceptor])),

		// Initializers
		provideAppInitializer(initializeAnalytics()),
		provideAppInitializer(initializeTranslation()),

		// Signal forms
		...provideSignalFormsConfig({}),

		// Translation — lazy-loads locale files, reads default language from environment
		provideTranslation({
			defaultLanguage: (environment.defaultLanguage as Language) ?? 'en',
			loader: async (lang: Language) => {
				switch (lang) {
					case 'en':
						return (await import('./providers/i18n/translations/en')).default
					case 'es':
						return (await import('./providers/i18n/translations/es')).default
					default:
						throw new Error(`Unsupported language: ${lang}`)
				}
			},
		}),

		// Custom providers
		Analytics,
		UIStore,
		provideTheme(),
		provideOverlayContainers(),
		provideProjectConfig(projectConfig),
		{ provide: TitleStrategy, useClass: NavigationTitleStrategy },

		// Identity (Auth0) and the Brillante API session; `withNavigationPermissionCheck()` routes
		// `NAVIGATION_PERMISSION_CHECK` through `AuthStore.currentUser`.
		provideIdentity(),
		provideAuth(withNavigationPermissionCheck()),
	],
}
