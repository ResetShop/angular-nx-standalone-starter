import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { ThemeToggle } from '@components/theme-toggle/theme-toggle';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[appHeader]',
	imports: [Breadcrumb, ThemeToggle],
	template: `
		<div class="flex w-full items-center justify-between">
			<app-breadcrumb />
			<app-theme-toggle />
		</div>
	`,
	styles: `
		:host {
			@reference "tailwindcss";
			@apply flex h-full items-center px-4 dark:text-gray-50;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {}
