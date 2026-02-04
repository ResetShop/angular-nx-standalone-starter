import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { isParentRoute, type NavigationRoute } from '@interfaces/navigation';
import { NgIcon } from '@ng-icons/core';
import { NavigationState } from '@providers/navigation/navigation-state';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[appNavItem]',
	imports: [NgIcon, RouterLink, RouterLinkActive],
	styles: `
		@reference "tailwindcss";

		:host {
			@apply text-sm hover:cursor-pointer;
		}

		a {
			@apply flex items-center gap-2 rounded-lg p-2 dark:text-gray-50;
		}

		a.active {
			@apply bg-blue-50 font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400;
		}

		a:hover,
		a.active:hover {
			@apply bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400;
		}

		.nav-children {
			max-height: 0;
			overflow: hidden;
			opacity: 0;
			transition:
				max-height var(--transition-duration, 200ms) ease-out,
				opacity var(--transition-duration, 200ms) ease-out;
		}

		.nav-children[data-expanded] {
			max-height: 100vh;
			opacity: 1;
		}

		@media (prefers-reduced-motion: reduce) {
			.nav-children,
			.rotate-90 {
				transition-duration: 0.01ms;
			}
		}

		button {
			@apply rounded-md hover:bg-black/5 dark:hover:bg-white/5;
		}
	`,
	template: `
		@if (hasChildren()) {
			<!-- Parent item with expand button -->
			<div class="nav-item-container">
				<button
					(click)="toggleExpanded()"
					(keydown.enter)="$event.preventDefault(); toggleExpanded()"
					(keydown.space)="$event.preventDefault(); toggleExpanded()"
					[attr.aria-expanded]="isExpanded()"
					[attr.aria-controls]="'nav-children-' + item().id"
					class="flex w-full items-center gap-2 p-2 text-left dark:text-gray-50"
				>
					@if (iconName(); as iconName) {
						<ng-icon [name]="iconName" data-testid="item-icon" />
					}
					<span [title]="item().name" class="truncate">{{ item().name }}</span>
					<ng-icon
						[class.rotate-90]="isExpanded()"
						name="featherChevronRight"
						class="ml-auto transition-transform duration-200"
						aria-hidden="true"
						data-testid="chevron-icon"
					/>
				</button>

				<!-- Children container -->
				<ul
					[id]="'nav-children-' + item().id"
					[attr.aria-hidden]="!isExpanded()"
					[attr.data-expanded]="isExpanded() || null"
					[style.--transition-duration.ms]="transitionDuration()"
					class="nav-children"
				>
					@for (child of children(); track child.id) {
						<li [item]="child" appNavItem class="pl-6"></li>
					}
				</ul>
			</div>
		} @else {
			<!-- Leaf item (no children) - original implementation -->
			<a [routerLink]="item().route" [routerLinkActiveOptions]="{ exact: false }" routerLinkActive="active">
				@if (iconName(); as iconName) {
					<ng-icon [name]="iconName" data-testid="item-icon" />
				}
				<span [title]="item().name" class="truncate">{{ item().name }}</span>
			</a>
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NavItem {
	readonly item = input.required<NavigationRoute>();

	/**
	 * Transition duration in milliseconds for expand/collapse animations.
	 * @default 200
	 */
	readonly transitionDuration = input<number>(200);

	private readonly router = inject(Router);
	private readonly navState = inject(NavigationState);

	/**
	 * Determines if this navigation item has child routes.
	 * @returns True if the item has at least one child route
	 */
	readonly hasChildren = computed(() => isParentRoute(this.item()));

	/**
	 * Returns the children navigation routes for parent routes
	 * @returns An array of NavigationRoute, which can be empty
	 */
	readonly children = computed((): NavigationRoute[] => {
		const route = this.item();
		if (isParentRoute(route)) {
			return route.children;
		}
		return [];
	});

	/**
	 * Checks if this navigation item is currently expanded.
	 * Always returns false for leaf items (items without children).
	 * @returns True if expanded, false if collapsed or has no children
	 */
	readonly isExpanded = computed(() => this.navState.isExpanded(this.item().id));

	/**
	 * Extracts the icon name from the navigation route's icon object.
	 * @returns The icon name as a string, or null if no icon is provided
	 */
	readonly iconName = computed(() => {
		const icon = this.item().icon;
		return icon ? Object.keys(icon)[0] : null; // Get the key name
	});

	constructor() {
		// Auto-expand when child route is active
		effect(
			() => {
				const item = this.item();
				if (!isParentRoute(item)) return;

				const hasActiveChild = item.children.some((child) =>
					this.router.isActive(child.route, {
						paths: 'subset',
						queryParams: 'ignored',
						fragment: 'ignored',
						matrixParams: 'ignored',
					}),
				);

				if (hasActiveChild && !this.isExpanded()) {
					this.navState.expand(item.id);
				}
			},
			{ manualCleanup: false },
		);
	}

	/**
	 * Toggles the expanded state of this navigation item.
	 * Only applicable to parent items with children. For leaf items, this method has no effect.
	 * The expansion state is managed by the NavigationStateService at the sidebar level.
	 */
	toggleExpanded(): void {
		this.navState.toggle(this.item().id);
	}
}
