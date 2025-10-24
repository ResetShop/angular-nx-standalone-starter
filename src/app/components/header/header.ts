import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Breadcrumb } from '../breadcrumb/breadcrumb';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[appHeader]',
	imports: [Breadcrumb],
	template: `<app-breadcrumb />`,
	styles: `
		:host {
			@reference "tailwindcss";
			@apply flex h-full items-center dark:text-gray-50;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {}
