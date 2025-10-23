import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BreadcrumbItem, NAVIGATION_CONFIG } from '@interfaces/navigation';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class Navigation {
	private router = inject(Router);
	private activatedRoute = inject(ActivatedRoute);
	private navigationConfig = inject(NAVIGATION_CONFIG);

	private readonly _sections = signal(this.navigationConfig.sections);
	private readonly _breadcrumbs = signal<BreadcrumbItem[]>([]);

	readonly sections = computed(() => this._sections());
	readonly breadcrumbs = computed(() => this._breadcrumbs());

	constructor() {
		this.router.events
			.pipe(
				takeUntilDestroyed(),
				filter((event) => event instanceof NavigationEnd),
			)
			.subscribe(() => {
				this._breadcrumbs.set(this.buildBreadcrumbs());
			});
	}

	private buildBreadcrumbs(): BreadcrumbItem[] {
		const breadcrumbs: BreadcrumbItem[] = [];
		let route = this.activatedRoute.root;
		let path = '';

		while (route) {
			const children = route.children;

			if (children.length === 0) {
				break;
			}

			// Find the first child in the primary outlet
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

		if (breadcrumbs.length > 0) {
			breadcrumbs[breadcrumbs.length - 1].isActive = true;
		}

		return breadcrumbs;
	}
}
