import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { RouterLink } from '@angular/router';
import { NavigationRoute } from '@interfaces/navigation';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[appNavItem]',
	imports: [NgIcon, RouterLink],
	template: `
		<a [routerLink]="item().route" class="flex items-center gap-2 p-2 dark:text-gray-50">
			@if (item().icon) {
				<ng-icon [name]="item().icon" data-testid="item-icon" />
			}
			<span class="truncate">{{ item().name }}</span>
		</a>
	`,
	styles: `
		@reference "tailwindcss";
		:host {
			@apply rounded-md text-sm hover:cursor-pointer hover:bg-black/5;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NavItem {
	readonly item = input.required<NavigationRoute>();
}
