import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

interface HealthApiResponse {
	message: string;
	timestamp: string;
	status: string;
}

@Component({
	selector: 'app-health',
	imports: [DatePipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="rounded-md border-1 border-gray-200 p-5">
			<header class="mb-2">
				<h1 class="text-lg font-bold">Application Health checker:</h1>
			</header>
			@if (healthResource.isLoading()) {
				<p>Loading...</p>
			} @else if (healthResource.error()) {
				<p class="text-error-100">Error: {{ healthResource.error()?.message }}</p>
			} @else if (healthResource.value(); as data) {
				<div class="rounded-sm bg-gray-100 p-4">
					<p class="mb-2"><strong>Message:</strong> {{ data.message }}</p>
					<p class="mb-2"><strong>Status:</strong> {{ data.status }}</p>
					<p class="mb-2">
						<strong>Date & Time:</strong>
						{{ data.timestamp | date: 'yyyy/mm/dd HH:mm (z)' }}
					</p>
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
