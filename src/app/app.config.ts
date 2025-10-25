import { provideHttpClient, withFetch } from '@angular/common/http';
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
import { NavigationTitleStrategy } from '@providers/navigation/navigation-title.strategy';
import { provideNavigation } from '@providers/navigation/navigation.provider';
import { provideProjectConfig } from '@providers/project/project.provider';
import { provideTheme } from '@providers/theme/theme';
import { appRoutes } from './app.routes';
import { environment } from './environments/environment';

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
		provideHttpClient(withFetch()),

		// Initializers
		provideAppInitializer(initializeAnalytics()),

		// Custom providers
		Analytics,
		// TODO: Add provider functions for custom providers
		provideTheme(),
		provideNavigation(),
		provideProjectConfig(),
		{ provide: TitleStrategy, useClass: NavigationTitleStrategy },
	],
};
