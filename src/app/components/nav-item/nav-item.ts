import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationRoute } from '@interfaces/navigation';
import { NgIcon } from '@ng-icons/core';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[appNavItem]',
	imports: [NgIcon, RouterLink, RouterLinkActive],
	styleUrl: './nav-item.css',
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
					<ng-icon
						[class.rotate-90]="isExpanded()"
						name="featherChevronRight"
						class="transition-transform duration-200"
						aria-hidden="true"
					/>
					@if (iconName(); as iconName) {
						<ng-icon [name]="iconName" data-testid="item-icon" />
					}
					<span class="truncate">{{ item().name }}</span>
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
				class="[&.active]:bg-primary/10 [&.active]:text-primary [&.active]:dark:bg-primary/20 flex items-center gap-2 p-2 dark:text-gray-50 [&.active]:font-medium"
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

	// Expansion state - using Set for O(1) lookups
	private readonly expandedItems = signal<Set<string>>(new Set());

	readonly hasChildren = computed(() => (this.item().children?.length ?? 0) > 0);

	readonly isExpanded = computed(() => this.expandedItems().has(this.item().id));

	readonly iconName = computed(() => {
		const icon = this.item().icon;
		return icon ? Object.keys(icon)[0] : null; // Get the key name
	});

	constructor() {
		// Auto-expand when child route is active
		effect(() => {
			const item = this.item();
			if (!item.children || item.children.length === 0) return;

			const currentUrl = this.router.url;
			const hasActiveChild = item.children.some((child) => currentUrl.includes(child.route));

			if (hasActiveChild && !this.isExpanded()) {
				this.expandedItems.update((items) => {
					const newSet = new Set(items);
					newSet.add(item.id);
					return newSet;
				});
			}
		});
	}

	toggleExpanded(): void {
		this.expandedItems.update((items) => {
			const newSet = new Set(items);
			if (newSet.has(this.item().id)) {
				newSet.delete(this.item().id);
			} else {
				newSet.add(this.item().id);
			}
			return newSet;
		});
	}
}
