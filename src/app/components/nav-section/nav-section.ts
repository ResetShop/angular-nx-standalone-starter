import { ChangeDetectionStrategy, Component, computed, inject, input, EnvironmentInjector } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { createEnvironmentInjector } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import NavItem from '@components/nav-item/nav-item';
import { NavigationSection } from '@interfaces/navigation';

@Component({
	selector: 'app-nav-section',
	imports: [NgComponentOutlet],
	template: `
		@if (showTitle()) {
			<div class="flex h-8 items-center px-2 text-xs font-medium text-black/70 dark:text-white/70">
				{{ section().name }}
			</div>
		}
		<ul>
			@for (navItem of navItems(); track navItem.id) {
				<li>
					<ng-container *ngComponentOutlet="NavItem; inputs: { item: navItem.route }; injector: navItem.injector" />
				</li>
			}
		</ul>
	`,
	styles: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NavSection {
	readonly NavItem = NavItem;
	readonly showTitle = input<boolean>(true);
	readonly section = input.required<NavigationSection>();

	private injector = inject(EnvironmentInjector);

	// We use a custom injector for the nav items to load ng-icons on demand using lazy loading
	// By providing the icon definitions in navigation.config.ts we're able to directly load the icons
	// that are rendered on the sidebar
	readonly navItems = computed(() =>
		this.section().routes.map((route) => ({
			id: route.id,
			route,
			injector: createEnvironmentInjector(route.icon ? [provideIcons(route.icon)] : [], this.injector),
		})),
	);
}
