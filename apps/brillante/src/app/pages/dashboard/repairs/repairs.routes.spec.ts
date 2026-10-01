import type { Route } from '@angular/router'
import routes from './repairs.routes'

describe('repairs routes', () => {
	const children: Route[] = routes[0].children ?? []

	it('declares one parent route that owns the section providers', () => {
		expect(routes).toHaveLength(1)
		expect(routes[0].providers).toHaveLength(6)
	})

	it('does not repeat providers on the child pages', () => {
		for (const child of children) {
			expect(child.providers).toBeUndefined()
		}
	})

	it('serves the list and the detail page, with no separate create or edit page', () => {
		expect(children.map((child) => child.path)).toEqual(['', ':id'])
	})

	it('titles every page with a translation key', () => {
		expect(children.map((child) => child.title)).toEqual(['REPAIRS.PAGE.TITLE', 'REPAIRS.DETAIL.TITLE'])
	})

	it('leaves the reading routes to the dashboard permission', () => {
		for (const child of children) {
			expect(child.canActivate).toBeUndefined()
		}
	})

	it('lazy loads every page component', async () => {
		for (const child of children) {
			const component = await (child.loadComponent as () => Promise<unknown>)()

			expect(component).toBeDefined()
		}
	})
})
