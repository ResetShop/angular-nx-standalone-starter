import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-welcome',
	imports: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: ` <h1 class="text-xl font-bold">
			<span> {{ title }} </span>
		</h1>
		<div>
			<h2 class="mb-2 text-lg font-semibold">TODO:</h2>
			<ol class="list-inside list-decimal">
				<li>
					Remove the test route from routes.ts and the test controller from /src/api/test.controllers.ts, which are only
					there for testing purposes. Also its corresponding .spec.ts file can be removed.
				</li>
				<li>Remove TestEndpointComponent from the app.component.ts file, and also from the project.</li>
				<li>
					Check which helpers you need to use in the application backend. You'll find the helpers in the
					/src/api/helpers folder, together with the environment information to set them up from environment variables
					in the /src/api/helpers/environment.ts file. To properly use the helpers you'll need to install specific
					packages, which are detailed in the comments for each of them.
				</li>
				<li>
					Under AnalyticsService, you'll find commented code that'll allow you to set up Vercel Speed Insights and
					Microsoft Clarity clients for Analytics.
				</li>
				<li>
					For the left sidebar that appears after a login is successful, you may want to update the navigation to a
					specific component of your application
				</li>
			</ol>
		</div>`,
})
export default class Welcome {
	protected title = 'Welcome to the Reset Dev Nx + Angular SSR starter repo 👋';
}
