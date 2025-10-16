import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

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
    <div class="test-endpoint">
      <h2>Test Endpoint Response:</h2>
      @if (testResource.isLoading()) {
      <p>Loading...</p>
      } @else if (testResource.error()) {
      <p class="error">Error: {{ testResource.error()?.message }}</p>
      } @else if (testResource.value(); as data) {
      <div class="response">
        <p><strong>Message:</strong> {{ data.message }}</p>
        <p><strong>Status:</strong> {{ data.status }}</p>
        <p><strong>Timestamp:</strong> {{ data.timestamp }}</p>
      </div>
      }
    </div>
  `,
  styles: `
    .test-endpoint {
      margin: 20px;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }

    .response {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
    }

    .response p {
      margin: 8px 0;
    }

    .error {
      color: red;
    }
  `,
})
export class TestEndpointComponent {
  private http = inject(HttpClient);

  testResource = rxResource({
    stream: () => this.http.get<TestResponse>('/api/test'),
  });
}
