import {
	ApplicationConfig,
	inject,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { Analytics } from '@providers/analytics/analytics';
import { environment } from './environments/environment';
import { provideNavigation } from '@providers/navigation/navigation.provider';

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
		provideAppInitializer(initializeAnalytics()),

		// Custom providers
		Analytics,
		provideNavigation(),
	],
};
