import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TestEndpointComponent } from './components/test-endpoint.component';

@Component({
  imports: [RouterModule, TestEndpointComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  template: `
    <h1 class="font-bold text-xl">
      <span> {{ title }} </span>
    </h1>
    <div>
      <h2 class="font-semibold text-lg mb-2">TODO:</h2>
      <ol class="list-decimal list-inside">
        <li>
          Remove the test route from routes.ts and the test controller from
          /src/api/test.controllers.ts, which are only there for testing
          purposes. Also its corresponding .spec.ts file can be removed.
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
  styles: `
  /*  Each time you want to use some specific Tailwind classes, like p-* and m-*, you need to import them here */
  @reference "tailwindcss";
  :host {
    @apply grid gap-4 p-4;
  }`,
})
export class App {
  protected title = 'Welcome to the Reset Dev Nx + Angular SSR starter repo 👋';
}
