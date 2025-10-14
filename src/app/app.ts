import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  template: `
    <h1>
      <span> Hello there, </span>
      Welcome app 👋
    </h1>
    <router-outlet />
  `,
  styles: ``,
})
export class App {
  protected title = 'app';
}
