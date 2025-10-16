import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TestEndpointComponent } from './components/test-endpoint.component';

@Component({
  imports: [RouterModule, TestEndpointComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  template: `
    <h1>
      <span> {{ title }} </span>
    </h1>
    <div>
      <h2>TODO:</h2>
      <ol>
        <li>
          Remove the test route from routes.ts and the test controller from
          /src/api/test.controllers.ts, which are only there for testing
          purposes
        </li>
        <li>
          Remove TestEndpointComponent from the app.component.ts file, and also
          from the project
        </li>
      </ol>
    </div>

    <app-test-endpoint />

    <router-outlet />
  `,
  styles: ``,
})
export class App {
  protected title = 'Welcome to the Reset Dev Nx + Angular SSR starter repo 👋';
}
