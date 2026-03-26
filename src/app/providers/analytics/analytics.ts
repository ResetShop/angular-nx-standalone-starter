import { Injectable } from '@angular/core'
import { environment } from '../../environments/environment'

@Injectable({
	providedIn: 'root',
})
export class Analytics {
	public async init() {
		if (!environment.clarityProjectId) {
			return
		}

		// TODO: Uncomment if you're using Clarity analytics, after installing the @microsoft/clarity package and setting the CLARITY_PROJECT_ID in the production define block of project.json
		try {
			// const clarityModule = await import('@microsoft/clarity');
			// const clarity = clarityModule.default;
			// clarity.init(environment.clarityProjectId);
		} catch (error) {
			console.error('Failed to initialize Clarity:', error)
		}
	}
}
