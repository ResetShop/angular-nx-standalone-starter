import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { featherChevronRight } from '@ng-icons/feather-icons';
import { Navigation } from '@providers/navigation/navigation';

@Component({
	selector: 'app-breadcrumb',
	standalone: true,
	imports: [NgIcon, RouterLink],
	providers: [provideIcons({ featherChevronRight })],
	template: `
		<nav class="flex items-center gap-1" aria-label="Breadcrumb">
			<ol class="flex flex-wrap items-center gap-1">
				@for (item of breadcrumbs(); track item.title; let index = $index) {
					<li>
						<div class="flex items-center gap-1">
							@if (!item.isActive) {
								<a [routerLink]="item.path" class="text-muted-foreground hover:text-foreground text-sm font-medium">
									{{ item.title }}
								</a>
							}
							@if (item.isActive) {
								<span class="text-foreground text-sm font-medium" aria-current="page">
									{{ item.title }}
								</span>
							}
						</div>
					</li>
					@if (index !== breadcrumbs().length - 1) {
						<li>
							<span class="text-muted-foreground flex items-center justify-center" aria-hidden="true">
								<ng-icon [size]="'0.75rem'" name="featherChevronRight" />
							</span>
						</li>
					}
				}
			</ol>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumb {
	private navigation = inject(Navigation);
	readonly breadcrumbs = computed(() => this.navigation.breadcrumbs());
}
