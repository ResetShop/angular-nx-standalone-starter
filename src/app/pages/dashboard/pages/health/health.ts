import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Alert, AlertDescription, AlertTitle } from '@components/alert/alert';
import { Badge } from '../../../../components/badge/badge';

interface DatabaseCheck {
	readonly status: 'healthy' | 'unhealthy';
	readonly responseTimeMs: number | null;
	readonly error?: string;
}

interface HealthApiResponse {
	readonly status: string;
	readonly timestamp: string;
	readonly checks: {
		readonly database: DatabaseCheck;
	};
}

@Component({
	selector: 'app-health',
	imports: [Alert, AlertDescription, AlertTitle, DatePipe, Badge],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="rounded-md border-1 border-gray-200 p-5">
			<header class="mb-2">
				<h1 class="text-lg font-bold">Application Health checker:</h1>
			</header>
			@if (healthResource.isLoading()) {
				<p>Loading...</p>
			} @else if (healthResource.error()) {
				<div appAlert variant="destructive">
					<h5 appAlertTitle>Error:</h5>
					<p appAlertDescription>{{ healthResource.error()?.message }}</p>
				</div>
			} @else if (healthResource.value(); as data) {
				<div class="mb-4 rounded-sm bg-gray-100 p-4">
					<p class="mb-2 flex items-center gap-1">
						<strong>Status:</strong>
						<span [variant]="data.status === 'healthy' ? 'default' : 'destructive'" appBadge>
							{{ data.status }}
						</span>
					</p>
					<p class="mb-2">
						<strong>Date & Time:</strong>
						{{ data.timestamp | date: 'yyyy/MM/dd HH:mm (z)' }}
					</p>
				</div>
				<h2 class="mb-2 text-base font-semibold">Checks</h2>
				<div class="rounded-sm bg-gray-100 p-4">
					<h3 class="mb-2 font-medium">Database</h3>
					<p class="mb-2 flex items-center gap-1">
						<strong>Status:</strong>
						<span [variant]="data.checks.database.status === 'healthy' ? 'default' : 'destructive'" appBadge>
							{{ data.checks.database.status }}
						</span>
					</p>
					@if (data.checks.database.responseTimeMs !== null) {
						<p class="mb-2">
							<strong>Response Time:</strong>
							{{ data.checks.database.responseTimeMs }}ms
						</p>
					}
					@if (data.checks.database.error) {
						<div appAlert variant="destructive">
							<h5 appAlertTitle>Error:</h5>
							<p appAlertDescription>{{ data.checks.database.error }}</p>
						</div>
					}
				</div>
			}
		</div>
	`,
})
export default class Health {
	private http = inject(HttpClient);

	healthResource = rxResource({
		stream: () => this.http.get<HealthApiResponse>('/api/health/v1'),
	});
}
