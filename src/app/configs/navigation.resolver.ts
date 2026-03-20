import type {
	NavigationConfig,
	NavigationInputConfig,
	NavigationRoute,
	NavigationRouteConfig,
} from '@interfaces/navigation'

/**
 * Resolves segment-based navigation config into fully resolved route paths.
 *
 * Each route's `segment` is concatenated with its ancestors to produce
 * a full `route` string (e.g., `dashboard/authorization/roles`).
 * Parent routes receive the first child's resolved route as their own.
 */
export function resolveNavigationConfig(input: NavigationInputConfig): NavigationConfig {
	return {
		sections: input.sections.map((section) => ({
			id: section.id,
			name: section.name,
			routes: resolveRoutes(section.routes, section.basePath),
		})),
	}
}

function resolveRoutes(configs: NavigationRouteConfig[], prefix: string): NavigationRoute[] {
	return configs.map((config) => {
		const resolvedPath = `${prefix}/${config.segment}`

		if (config.children && config.children.length > 0) {
			const resolvedChildren = resolveRoutes(config.children, resolvedPath)
			return {
				id: config.id,
				name: config.name,
				route: resolvedChildren[0].route,
				...(config.icon && { icon: config.icon }),
				...(config.permission && { permission: config.permission }),
				// Safe cast: this branch is only reached when config.children.length > 0 (line 29)
				children: resolvedChildren as [NavigationRoute, ...NavigationRoute[]],
			}
		}

		return {
			id: config.id,
			name: config.name,
			route: resolvedPath,
			...(config.icon && { icon: config.icon }),
			...(config.permission && { permission: config.permission }),
		}
	})
}
