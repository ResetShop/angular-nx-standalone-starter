import { InjectionToken } from '@angular/core';
import { Type } from '@angular/core';
import { Resolve, ResolveFn, Route } from '@angular/router';

export interface BreadcrumbItem {
	title: string;
	path: string;
	isActive: boolean;
}

export interface NavigationSection {
	id: string;
	name: string;
	routes: NavigationRoute[];
}

export interface NavigationRoute {
	id: string;
	name: string;
	route: string;
	icon?: Record<string, string>;
	children: Omit<NavigationRoute, 'children'>[]; // TODO: Remove Omit if navigation has more than 1 level of nesting
}

export interface NamedRoute extends Route {
	title: string | Type<Resolve<string>> | ResolveFn<string>;
}

export interface NavigationConfig {
	sections: NavigationSection[];
}

export const NAVIGATION_CONFIG = new InjectionToken<NavigationConfig>('Navigation Configuration');
