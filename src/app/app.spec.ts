import { render } from "@testing-library/angular";
import { App } from "./app";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { Analytics } from "@providers/analytics/analytics";
import { AnalyticsMock } from "@providers/analytics/analytics.mock";

describe("App", () => {
  it("should create the app component", async () => {
    const { fixture } = await render(App, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: Analytics, useClass: AnalyticsMock },
      ],
    });

    expect(fixture.componentInstance).toBeTruthy();
  });
});
