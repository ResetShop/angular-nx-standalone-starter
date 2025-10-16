import {
  ChangeDetectionStrategy,
  Component,
  input,
  TemplateRef,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";

@Component({
  selector: "app-card",
  imports: [NgTemplateOutlet],
  template: `
    <div
      class="flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl p-4 md:p-5 dark:bg-neutral-900 dark:border-neutral-700 dark:shadow-neutral-700/70 gap-4"
    >
      @if (titleTemplate() || subtitleTemplate()) {
      <div>
        @if (titleTemplate()) {
        <h2 class="text-2xl/9 font-bold tracking-tight text-gray-900">
          <ng-container *ngTemplateOutlet="titleTemplate()" />
        </h2>
        } @if (subtitleTemplate()) {
        <div
          class="mt-1 text-xs font-medium uppercase text-gray-500 dark:text-neutral-500"
        >
          <ng-container *ngTemplateOutlet="subtitleTemplate()" />
        </div>
        }
      </div>
      } @if (contentTemplate()) {
      <div class="mt-2 text-gray-500 dark:text-neutral-400">
        <ng-container *ngTemplateOutlet="contentTemplate()" />
      </div>
      } @if (footerTemplate()) {
      <div class="mt-8">
        <ng-container *ngTemplateOutlet="footerTemplate()" />
      </div>
      }
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Card {
  readonly titleTemplate = input<TemplateRef<void>>();
  readonly subtitleTemplate = input<TemplateRef<void>>();
  readonly contentTemplate = input<TemplateRef<void>>();
  readonly footerTemplate = input<TemplateRef<void>>();
}
