import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { featherChevronRight } from '@ng-icons/feather-icons';

interface BreadcrumbItem {
	title: string;
	path: string;
	isActive: boolean;
}

@Component({
	selector: 'app-breadcrumb',
	standalone: true,
	imports: [CommonModule, NgIcon],
	providers: [provideIcons({ featherChevronRight })],
	template: `
		<nav class="flex items-center gap-1" aria-label="Breadcrumb">
			<ol class="flex flex-wrap items-center gap-1">
				@for (item of breadcrumbs(); track item.title; let index = $index) {
					<li>
						<div class="flex items-center gap-1">
							@if (!item.isActive) {
								<a
									(click)="navigate(item.path, $event)"
									[href]="item.path"
									class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
								>
									{{ item.title }}
								</a>
							}
							@if (item.isActive) {
								<span class="text-sm font-medium text-gray-900 dark:text-gray-50" aria-current="page">
									{{ item.title }}
								</span>
							}
						</div>
					</li>
					@if (index !== breadcrumbs().length - 1) {
						<li>
							<span class="flex items-center justify-center text-gray-400 dark:text-gray-600" aria-hidden="true">
								<ng-icon [size]="'0.75rem'" name="featherChevronRight" />
							</span>
						</li>
					}
				}
			</ol>
		</nav>
	`,
	styles: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumb {
	readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

	router = inject(Router);
	activatedRoute = inject(ActivatedRoute);

	constructor() {
		this.router.events
			.pipe(
				takeUntilDestroyed(),
				filter((event) => event instanceof NavigationEnd),
			)
			.subscribe(() => {
				this.buildBreadcrumbs();
			});
	}

	private buildBreadcrumbs(): void {
		const breadcrumbs: BreadcrumbItem[] = [];
		let route = this.activatedRoute.root;
		let path = '';

		while (route) {
			const children = route.children;

			if (children.length === 0) {
				break;
			}

			// Find the first child that has a name
			const child = children.find((c) => c.outlet === 'primary');

			if (!child) {
				break;
			}

			const routeConfig = child.routeConfig;
			const routePath = routeConfig?.path || '';
			const routeName = routeConfig?.title;

			path += `/${routePath}`;

			if (routeName) {
				breadcrumbs.push({
					title: routeName as string,
					path,
					isActive: false,
				});
			}

			route = child;
		}

		// Mark the last breadcrumb as active
		if (breadcrumbs.length > 0) {
			breadcrumbs[breadcrumbs.length - 1].isActive = true;
		}

		this.breadcrumbs.set(breadcrumbs);
	}

	navigate(path: string, event: Event): void {
		event.preventDefault();
		this.router.navigateByUrl(path);
	}
}
