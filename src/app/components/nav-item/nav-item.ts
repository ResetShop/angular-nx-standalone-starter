import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationRoute } from '@interfaces/navigation';
import { NgIcon } from '@ng-icons/core';
import { NavigationStateService } from '@services/navigation-state.service';

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
			@apply rounded-lg;
		}

		.nav-children {
			max-height: 0;
			overflow: hidden;
			opacity: 0;
			transition:
				max-height 200ms ease-out,
				opacity 200ms ease-out;
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
					(keydown.enter)="toggleExpanded()"
					(keydown.space)="$event.preventDefault(); toggleExpanded()"
					[attr.aria-expanded]="isExpanded()"
					[attr.aria-controls]="'nav-children-' + item().id"
					class="flex w-full items-center gap-2 p-2 text-left dark:text-gray-50"
				>
					@if (iconName(); as iconName) {
						<ng-icon [name]="iconName" data-testid="item-icon" />
					}
					<span class="truncate">{{ item().name }}</span>
					<ng-icon
						[class.rotate-90]="isExpanded()"
						name="featherChevronRight"
						class="ml-auto transition-transform duration-200"
						aria-hidden="true"
					/>
				</button>

				<!-- Children container -->
				<ul
					[id]="'nav-children-' + item().id"
					[attr.aria-hidden]="!isExpanded()"
					[attr.data-expanded]="isExpanded() || null"
					class="nav-children"
				>
					@for (child of item().children; track child.id) {
						<li [item]="child" appNavItem class="pl-6"></li>
					}
				</ul>
			</div>
		} @else {
			<!-- Leaf item (no children) - original implementation -->
			<a
				[routerLink]="item().route"
				[routerLinkActiveOptions]="{ exact: false }"
				routerLinkActive="active"
				class="[&.active]:bg-primary/10 [&.active]:text-primary [&.active]:dark:bg-primary/20 [&:hover]:bg-primary/10 [&:hover]:text-primary [&:hover]:dark:bg-primary/20 flex items-center gap-2 p-2 dark:text-gray-50 [&.active]:font-medium [&.active:hover]:font-medium"
			>
				@if (iconName(); as iconName) {
					<ng-icon [name]="iconName" data-testid="item-icon" />
				}
				<span class="truncate">{{ item().name }}</span>
			</a>
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NavItem {
	readonly item = input.required<NavigationRoute>();
	private readonly router = inject(Router);
	private readonly navState = inject(NavigationStateService);

	readonly hasChildren = computed(() => (this.item().children?.length ?? 0) > 0);

	readonly isExpanded = computed(() => this.navState.isExpanded(this.item().id));

	readonly iconName = computed(() => {
		const icon = this.item().icon;
		return icon ? Object.keys(icon)[0] : null; // Get the key name
	});

	constructor() {
		// Auto-expand when child route is active
		effect(
			() => {
				const item = this.item();
				if (!item.children || item.children.length === 0) return;

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

	toggleExpanded(): void {
		this.navState.toggle(this.item().id);
	}
}
