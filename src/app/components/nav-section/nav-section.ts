import { NgComponentOutlet } from '@angular/common'
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	createEnvironmentInjector,
	EnvironmentInjector,
	inject,
	input,
} from '@angular/core'
import NavItem from '@components/nav-item/nav-item'
import { NavigationSection } from '@interfaces/navigation'
import { provideIcons } from '@ng-icons/core'
import { featherChevronRight } from '@ng-icons/feather-icons'

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
	protected readonly NavItem = NavItem
	public readonly showTitle = input<boolean>(true)
	public readonly section = input.required<NavigationSection>()

	private readonly injector = inject(EnvironmentInjector)

	// We use a custom injector for the nav items to load ng-icons on demand using lazy loading
	// By providing the icon definitions in navigation.config.ts we're able to directly load the icons
	// that are rendered on the sidebar
	// We also provide the chevron icon for expandable navigation items
	protected readonly navItems = computed(() =>
		this.section().routes.map((route) => ({
			id: route.id,
			route,
			injector: createEnvironmentInjector(
				route.icon ? [provideIcons({ ...route.icon, featherChevronRight })] : [provideIcons({ featherChevronRight })],
				this.injector,
			),
		})),
	)
}
