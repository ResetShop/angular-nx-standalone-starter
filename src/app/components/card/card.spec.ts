import { render, screen } from "@testing-library/angular";
import { Component } from "@angular/core";
import Card from "./card";

describe("Card", () => {
  it("should render title template when provided", async () => {
    @Component({
      template: `
        <app-card [titleTemplate]="titleTpl">
          <ng-template #titleTpl>Test Title</ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Test Title"
    );
  });

  it("should render subtitle template when provided", async () => {
    @Component({
      template: `
        <app-card [subtitleTemplate]="subtitleTpl">
          <ng-template #subtitleTpl>Test Subtitle</ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });

  it("should render content template when provided", async () => {
    @Component({
      template: `
        <app-card [contentTemplate]="contentTpl">
          <ng-template #contentTpl>Test Content</ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should render footer template when provided", async () => {
    @Component({
      template: `
        <app-card [footerTemplate]="footerTpl">
          <ng-template #footerTpl>Test Footer</ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    expect(screen.getByText("Test Footer")).toBeInTheDocument();
  });

  it("should render all templates when all are provided", async () => {
    @Component({
      template: `
        <app-card
          [titleTemplate]="titleTpl"
          [subtitleTemplate]="subtitleTpl"
          [contentTemplate]="contentTpl"
          [footerTemplate]="footerTpl"
        >
          <ng-template #titleTpl>Full Title</ng-template>
          <ng-template #subtitleTpl>Full Subtitle</ng-template>
          <ng-template #contentTpl>Full Content</ng-template>
          <ng-template #footerTpl>Full Footer</ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    expect(screen.getByText("Full Title")).toBeInTheDocument();
    expect(screen.getByText("Full Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Full Content")).toBeInTheDocument();
    expect(screen.getByText("Full Footer")).toBeInTheDocument();
  });

  it("should not render title section when neither title nor subtitle templates are provided", async () => {
    @Component({
      template: `
        <app-card [contentTemplate]="contentTpl">
          <ng-template #contentTpl>Only Content</ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    expect(screen.getByText("Only Content")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("should render with title but no subtitle", async () => {
    @Component({
      template: `
        <app-card [titleTemplate]="titleTpl">
          <ng-template #titleTpl>Only Title</ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    expect(screen.getByText("Only Title")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("should render with subtitle but no title", async () => {
    @Component({
      template: `
        <app-card [subtitleTemplate]="subtitleTpl">
          <ng-template #subtitleTpl>Only Subtitle</ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    expect(screen.getByText("Only Subtitle")).toBeInTheDocument();
  });

  it("should render complex template content with HTML elements", async () => {
    @Component({
      template: `
        <app-card [titleTemplate]="titleTpl" [contentTemplate]="contentTpl">
          <ng-template #titleTpl>
            <span>Complex</span> <strong>Title</strong>
          </ng-template>
          <ng-template #contentTpl>
            <p>Paragraph content</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    expect(screen.getByText("Complex")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Paragraph content")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("should render empty card when no templates are provided", async () => {
    await render(Card);

    // The card wrapper should still exist with its classes
    const cardElement = document.querySelector(
      ".flex.flex-col.bg-white.border"
    );
    expect(cardElement).toBeInTheDocument();
  });

  it("should apply correct CSS classes to card container", async () => {
    @Component({
      template: `
        <app-card [titleTemplate]="titleTpl">
          <ng-template #titleTpl>Test</ng-template>
        </app-card>
      `,
      imports: [Card],
    })
    class TestComponent {}

    await render(TestComponent);

    const cardElement = document.querySelector(
      ".flex.flex-col.bg-white.border"
    );
    expect(cardElement).toHaveClass(
      "flex",
      "flex-col",
      "bg-white",
      "border",
      "border-gray-200",
      "shadow-2xs",
      "rounded-xl",
      "p-4",
      "md:p-5",
      "dark:bg-neutral-900",
      "dark:border-neutral-700",
      "dark:shadow-neutral-700/70",
      "gap-4"
    );
  });
});
