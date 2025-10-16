import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

interface TestResponse {
  message: string;
  timestamp: string;
  status: string;
}

@Component({
  selector: 'app-test-endpoint',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-5 border-gray-200 border-1 rounded-md">
      <header class="mb-2">
        <h1 class="text-lg font-bold">Application health status:</h1>
      </header>
      @if (testResource.isLoading()) {
      <p>Loading...</p>
      } @else if (testResource.error()) {
      <p class="text-error-100">Error: {{ testResource.error()?.message }}</p>
      } @else if (testResource.value(); as data) {
      <div class="bg-gray-100 p-4 rounded-sm">
        <p class="mb-2"><strong>Message:</strong> {{ data.message }}</p>
        <p class="mb-2"><strong>Status:</strong> {{ data.status }}</p>
        <p class="mb-2">
          <strong>Date & Time:</strong>
          {{ data.timestamp | date : 'yyyy/mm/dd HH:mm (z)' }}
        </p>
      </div>
      }
    </div>
  `,
  imports: [DatePipe],
})
export class TestEndpointComponent {
  private http = inject(HttpClient);

  testResource = rxResource({
    stream: () => this.http.get<TestResponse>('/api/health/v1'),
  });
}
