import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, TemplateRef } from '@angular/core';

@Component({
	selector: 'app-card',
	imports: [NgTemplateOutlet],
	template: `
		<div class="border-border bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 shadow-2xs md:p-5">
			@if (titleTemplate() || subtitleTemplate()) {
				<div>
					@if (titleTemplate()) {
						<h2 class="text-foreground text-2xl/9 font-bold tracking-tight">
							<ng-container *ngTemplateOutlet="titleTemplate()" />
						</h2>
					}
					@if (subtitleTemplate()) {
						<div class="text-muted-foreground mt-1 text-xs font-medium uppercase">
							<ng-container *ngTemplateOutlet="subtitleTemplate()" />
						</div>
					}
				</div>
			}
			@if (contentTemplate()) {
				<div class="text-muted-foreground mt-2">
					<ng-container *ngTemplateOutlet="contentTemplate()" />
				</div>
			}
			@if (footerTemplate()) {
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
