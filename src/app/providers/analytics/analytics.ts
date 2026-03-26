import { inject, Injectable } from '@angular/core'
import { Logger } from '@providers/logger/logger.token'
import { environment } from '../../environments/environment'

@Injectable({
	providedIn: 'root',
})
export class Analytics {
	private readonly logger = inject(Logger)

	public async init() {
		if (!environment.clarityProjectId) {
			return
		}

		// TODO: Uncomment if you're using Clarity analytics, after installing the @microsoft/clarity package and setting __ENV_CLARITY_PROJECT_ID__ in the production define block of project.json
		try {
			// const clarityModule = await import('@microsoft/clarity');
			// const clarity = clarityModule.default;
			// clarity.init(environment.clarityProjectId);
		} catch (error) {
			this.logger.error('Analytics', 'Failed to initialize Clarity', error as Error)
		}
	}
}
