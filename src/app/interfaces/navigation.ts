import { InjectionToken, Type } from '@angular/core'
import { Resolve, ResolveFn, Route } from '@angular/router'

export interface BreadcrumbItem {
	title: string
	path: string
	isActive: boolean
}

export interface NavigationSection {
	id: string
	name: string
	routes: NavigationRoute[]
}

/**
 * Leaf navigation route without children.
 * Renders as a clickable link.
 */
export interface LeafNavigationRoute {
	id: string
	name: string
	route: string
	icon?: Record<string, string>
	/** Permission identifier required to view this route (e.g. 'users:read'). Omit for public routes. */
	permission?: string
}

/**
 * Parent navigation route with expandable children.
 * Renders as an expandable button with nested routes.
 * Requires at least one child route.
 */
export interface ParentNavigationRoute {
	id: string
	name: string
	route: string
	icon?: Record<string, string>
	/** Permission required to display the parent group itself. Children are independently filtered by their own permission fields. */
	permission?: string
	children: [NavigationRoute, ...NavigationRoute[]] // Non-empty array
}

/**
 * Navigation route can be either a leaf (no children) or a parent (with children).
 * TypeScript discriminates based on the presence of the `children` property.
 */
export type NavigationRoute = LeafNavigationRoute | ParentNavigationRoute

/**
 * Type guard to check if a navigation route is a parent with children.
 */
export function isParentRoute(route: NavigationRoute): route is ParentNavigationRoute {
	return 'children' in route && Array.isArray(route.children) && route.children.length > 0
}

/**
 * Type guard to check if a navigation route is a leaf without children.
 */
export function isLeafRoute(route: NavigationRoute): route is LeafNavigationRoute {
	return !('children' in route)
}

export interface NamedRoute extends Route {
	title: string | Type<Resolve<string>> | ResolveFn<string>
}

export interface NavigationConfig {
	sections: NavigationSection[]
}

export const NAVIGATION_CONFIG = new InjectionToken<NavigationConfig>('Navigation Configuration')

// ============================================================================
// Authoring types — segment-based config that gets resolved into runtime types
// ============================================================================

/**
 * Segment-based route definition for authoring navigation config.
 * Each route declares only its own segment; the resolver concatenates
 * basePath + parent segments + own segment into a full route at registration time.
 */
export interface NavigationRouteConfig {
	id: string
	name: string
	segment: string
	icon?: Record<string, string>
	permission?: string
	children?: [NavigationRouteConfig, ...NavigationRouteConfig[]]
}

export interface NavigationSectionConfig {
	id: string
	name: string
	basePath: string
	routes: NavigationRouteConfig[]
}

export interface NavigationInputConfig {
	sections: NavigationSectionConfig[]
}
