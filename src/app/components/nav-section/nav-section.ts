import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import NavItem from '@components/nav-item/nav-item';
import { NavigationSection } from '@interfaces/navigation';

@Component({
	selector: 'app-nav-section',
	imports: [NavItem],
	template: `
		@if (showTitle()) {
			<div class="flex h-8 items-center px-2 text-xs font-medium text-black/70 dark:text-white/70">
				{{ section().name }}
			</div>
		}
		<ul>
			@for (route of section().routes; track route.id) {
				<li [item]="route" appNavItem></li>
			}
		</ul>
	`,
	styles: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NavSection {
	readonly showTitle = input<boolean>(true);
	readonly section = input.required<NavigationSection>();
}
