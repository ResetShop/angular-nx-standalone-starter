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
