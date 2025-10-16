import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from "@angular/core";
import { RouterModule } from "@angular/router";

// Environment
import { environment } from "./environments/environment";

// Providers
import { Analytics } from "@providers/analytics/analytics";

@Component({
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-root",
  template: ` <router-outlet /> `,
})
export class App implements OnInit {
  private readonly analytics = inject(Analytics);

  async ngOnInit() {
    if (environment.environment !== "production") {
      return;
    }
    await this.analytics.init();
  }
}
