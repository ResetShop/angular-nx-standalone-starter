import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TestEndpointComponent } from './components/test-endpoint.component';

@Component({
  imports: [RouterModule, TestEndpointComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  template: `
    <h1>
      <span> Welcome to the Reset Dev Nx + Angular SSR starter repo 👋 </span>
    </h1>
    <div>
      <h2>TODO:</h2>
      <ol>
        <li>
          Remove the test route from routes.ts and the test controller from
          /src/api/test.controllers.ts, which are only there for testing
          purposes
        </li>
      </ol>
    </div>

    <app-test-endpoint />

    <router-outlet />
  `,
  styles: ``,
})
export class App {
  protected title = 'app';
}
