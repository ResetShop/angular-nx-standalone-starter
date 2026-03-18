import { computed, makeEnvironmentProviders, signal } from '@angular/core'
import type { BreadcrumbItem, NavigationSection } from '@interfaces/navigation'
import { NAVIGATION_CONFIG } from '@interfaces/navigation'
import { Navigation } from './navigation'
import { NavigationState } from './navigation-state'

export class NavigationMock {
	private readonly _sections = signal<NavigationSection[]>([])
	private readonly _breadcrumbs = signal<BreadcrumbItem[]>([])

	public readonly sections = computed(() => this._sections())
	public readonly breadcrumbs = computed(() => this._breadcrumbs())

	public setSections(sections: NavigationSection[]): void {
		this._sections.set(sections)
	}

	public setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
		this._breadcrumbs.set(breadcrumbs)
	}
}

export function provideNavigationMock(mock = new NavigationMock()) {
	return makeEnvironmentProviders([
		{ provide: Navigation, useValue: mock },
		{ provide: NavigationState, useValue: new NavigationState() },
		{ provide: NAVIGATION_CONFIG, useValue: { sections: [] } },
	])
}
