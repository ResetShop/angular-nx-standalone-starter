import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
	ApplicationConfig,
	inject,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';
import { Analytics } from '@providers/analytics/analytics';
import { initializeAuth } from '@providers/auth/auth.initializer';
import { NavigationTitleStrategy } from '@providers/navigation/navigation-title.strategy';
import { provideNavigation } from '@providers/navigation/navigation.provider';
import { provideProjectConfig } from '@providers/project/project.provider';
import { provideTheme } from '@providers/theme/theme';
import { appRoutes } from './app.routes';
import { environment } from './environments/environment';
import { authInterceptor } from './interceptors/auth.interceptor';
import { tokenRefreshInterceptor } from './interceptors/token-refresh.interceptor';

function initializeAnalytics() {
	return async () => {
		if (environment.environment !== 'production') {
			return;
		}

		const analytics = inject(Analytics);
		await analytics.init();
	};
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideClientHydration(withEventReplay()),
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(appRoutes),
		provideHttpClient(withFetch(), withInterceptors([authInterceptor, tokenRefreshInterceptor])),

		// Initializers
		provideAppInitializer(initializeAnalytics()),
		provideAppInitializer(initializeAuth()),

		// Custom providers
		Analytics,
		// TODO: Add provider functions for custom providers
		provideTheme(),
		provideNavigation(),
		provideProjectConfig(),
		{ provide: TitleStrategy, useClass: NavigationTitleStrategy },
	],
};
