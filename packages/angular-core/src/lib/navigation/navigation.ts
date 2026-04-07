import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router'
import { filter } from 'rxjs'
import type { NavigationRoute, NavigationSection } from '../interfaces/navigation'
import { BreadcrumbItem, isParentRoute, NAVIGATION_CONFIG } from '../interfaces/navigation'

/**
 * Injection token for the permission-checking function.
 *
 * Accepts a permission string and returns whether the current user has that permission.
 * Default factory allows all routes (returns `true` for any permission).
 *
 * Consumers override this in their app config to wire it to their auth system:
 * ```typescript
 * {
 *   provide: NAVIGATION_PERMISSION_CHECK,
 *   useFactory: () => {
 *     const store = inject(AuthStore)
 *     return (p: string) => store.currentUser()?.hasPermission(p) ?? false
 *   }
 * }
 * ```
 */
export const NAVIGATION_PERMISSION_CHECK = new InjectionToken<(permission: string) => boolean>(
	'NavigationPermissionCheck',
	{
		providedIn: 'root',
		factory: () => () => true,
	},
)

@Injectable({
	providedIn: 'root',
})
export class Navigation {
	private readonly router = inject(Router)
	private readonly activatedRoute = inject(ActivatedRoute)
	private readonly navigationConfig = inject(NAVIGATION_CONFIG)
	private readonly permissionCheck = inject(NAVIGATION_PERMISSION_CHECK)

	private readonly _breadcrumbs = signal<BreadcrumbItem[]>([])

	public readonly sections = computed(() => this.filterSections(this.navigationConfig.sections))
	public readonly breadcrumbs = computed(() => this._breadcrumbs())

	constructor() {
		this.router.events
			.pipe(
				takeUntilDestroyed(),
				filter((event) => event instanceof NavigationEnd),
			)
			.subscribe(() => {
				this._breadcrumbs.set(this.buildBreadcrumbs())
			})
	}

	/** Filters out routes the current user lacks permission for, recursively for parent routes. */
	private filterSections(sections: NavigationSection[]): NavigationSection[] {
		return sections
			.map((section) => ({
				...section,
				routes: this.filterRoutes(section.routes),
			}))
			.filter((section) => section.routes.length > 0)
	}

	private filterRoutes(routes: NavigationRoute[]): NavigationRoute[] {
		return routes.map((route) => this.filterRoute(route)).filter((route): route is NavigationRoute => route !== null)
	}

	private filterRoute(route: NavigationRoute): NavigationRoute | null {
		if (!this.isPermitted(route.permission)) {
			return null
		}

		if (isParentRoute(route)) {
			const filteredChildren = this.filterRoutes(route.children)
			if (filteredChildren.length === 0) {
				return null
			}
			return { ...route, children: filteredChildren as [NavigationRoute, ...NavigationRoute[]] }
		}

		return route
	}

	private isPermitted(permission: string | undefined): boolean {
		if (!permission) {
			return true
		}
		return this.permissionCheck(permission)
	}

	private buildBreadcrumbs(): BreadcrumbItem[] {
		const breadcrumbs: BreadcrumbItem[] = []
		let route = this.activatedRoute.root
		let path = ''

		while (route) {
			const children = route.children

			if (children.length === 0) {
				break
			}

			const child = children.find((c) => c.outlet === 'primary')

			if (!child) {
				break
			}

			const routeConfig = child.routeConfig
			const routePath = routeConfig?.path || ''
			const routeName = routeConfig?.title

			path += `/${routePath}`

			if (routeName) {
				breadcrumbs.push({
					title: routeName as string,
					path,
					isActive: false,
				})
			}

			route = child
		}

		if (breadcrumbs.length > 0) {
			breadcrumbs[breadcrumbs.length - 1].isActive = true
		}

		return breadcrumbs
	}
}
