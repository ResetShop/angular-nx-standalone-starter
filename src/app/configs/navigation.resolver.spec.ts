import type { NavigationInputConfig } from '@interfaces/navigation'
import { resolveNavigationConfig } from './navigation.resolver'

describe('resolveNavigationConfig', () => {
	it('should resolve a single leaf route with basePath + segment', () => {
		const input: NavigationInputConfig = {
			sections: [
				{ id: 's1', name: 'Section', basePath: 'dashboard', routes: [{ id: 'home', name: 'Home', segment: 'home' }] },
			],
		}

		const result = resolveNavigationConfig(input)

		expect(result.sections[0].routes[0].route).toBe('dashboard/home')
	})

	it('should resolve nested children with concatenated paths', () => {
		const input: NavigationInputConfig = {
			sections: [
				{
					id: 's1',
					name: 'Section',
					basePath: 'dashboard',
					routes: [
						{
							id: 'parent',
							name: 'Parent',
							segment: 'auth',
							children: [{ id: 'child', name: 'Child', segment: 'roles' }],
						},
					],
				},
			],
		}

		const result = resolveNavigationConfig(input)
		const parent = result.sections[0].routes[0]

		expect('children' in parent && parent.children[0].route).toBe('dashboard/auth/roles')
	})

	it('should set parent route to the first child resolved route', () => {
		const input: NavigationInputConfig = {
			sections: [
				{
					id: 's1',
					name: 'Section',
					basePath: 'dashboard',
					routes: [
						{
							id: 'parent',
							name: 'Parent',
							segment: 'auth',
							children: [
								{ id: 'first', name: 'First', segment: 'roles' },
								{ id: 'second', name: 'Second', segment: 'permissions' },
							],
						},
					],
				},
			],
		}

		const result = resolveNavigationConfig(input)

		expect(result.sections[0].routes[0].route).toBe('dashboard/auth/roles')
	})

	it('should produce independent prefixes for different sections', () => {
		const input: NavigationInputConfig = {
			sections: [
				{ id: 's1', name: 'Dashboard', basePath: 'dashboard', routes: [{ id: 'home', name: 'Home', segment: 'home' }] },
				{ id: 's2', name: 'Admin', basePath: 'admin', routes: [{ id: 'users', name: 'Users', segment: 'users' }] },
			],
		}

		const result = resolveNavigationConfig(input)

		expect(result.sections[0].routes[0].route).toBe('dashboard/home')
		expect(result.sections[1].routes[0].route).toBe('admin/users')
	})

	it('should handle a section with no routes', () => {
		const input: NavigationInputConfig = {
			sections: [{ id: 's1', name: 'Empty', basePath: 'dashboard', routes: [] }],
		}

		const result = resolveNavigationConfig(input)

		expect(result.sections[0].routes).toHaveLength(0)
	})

	it('should preserve id, name, icon, and permission fields', () => {
		const icon = { featherHome: 'featherHome' }
		const input: NavigationInputConfig = {
			sections: [
				{
					id: 's1',
					name: 'Section',
					basePath: 'dashboard',
					routes: [{ id: 'home', name: 'Home', segment: 'home', icon, permission: 'admin:home:read' }],
				},
			],
		}

		const result = resolveNavigationConfig(input)
		const route = result.sections[0].routes[0]

		expect(route.id).toBe('home')
		expect(route.name).toBe('Home')
		expect(route.icon).toEqual(icon)
		expect(route.permission).toBe('admin:home:read')
	})

	it('should preserve section id and name', () => {
		const input: NavigationInputConfig = {
			sections: [{ id: 'settings', name: 'Ajustes', basePath: 'dashboard', routes: [] }],
		}

		const result = resolveNavigationConfig(input)

		expect(result.sections[0].id).toBe('settings')
		expect(result.sections[0].name).toBe('Ajustes')
	})
})
