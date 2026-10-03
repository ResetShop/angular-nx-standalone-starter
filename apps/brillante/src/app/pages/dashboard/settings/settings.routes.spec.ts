import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter, Router, type Route } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { Permission } from '@contracts/permission/legacy-permission.constants'
import { officeBranchGuard } from '@guards/office-branch.guard'
import { permissionGuard } from '@guards/permission.guard'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import { provideIdentityMock } from '@providers/identity/identity.mock'
import { provideOfficeBranchMock } from '@providers/office-branch/office-branch.mock'
import { clearAllMocks, spyOn, useFakeTimers, useRealTimers } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { UIStore } from '@store/ui/ui.store'
import { NotificationType } from '@store/ui/ui.types'
import { environment } from '../../../environments/environment'
import Concepts from './concepts/concepts'
import AddOfficeBranch from './office-branches/add-office-branch/add-office-branch'
import OfficeBranches from './office-branches/office-branches'
import SettingsHome from './settings-home/settings-home'
import routes from './settings.routes'
import UserManagement from './user-management/user-management'

@Component({ selector: 'app-dashboard-stub', template: '' })
class DashboardStub {}

describe('settings routes', () => {
	const routeConfig: Route[] = routes

	function sectionOf(path: string): Route {
		const section = routeConfig.find((route) => route.path === path)
		if (!section) throw new Error(`No route for ${path}`)
		return section
	}

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		localStorage.clear()
	})

	afterEach(() => {
		useRealTimers()
		localStorage.clear()
	})

	describe('configuration', () => {
		it('should declare the home page and one route per section', () => {
			expect(routeConfig.map((route) => route.path)).toEqual(['', 'office-branches', 'user-management', 'concepts'])
		})

		it('should title the pages with translation keys', () => {
			expect(routeConfig[0].title).toBe('SETTINGS.TITLE')
			expect(sectionOf('office-branches').children?.map((child) => child.title)).toEqual([
				'OFFICE_BRANCHES.TITLE',
				'OFFICE_BRANCHES.ADD.TITLE',
			])
			expect(sectionOf('user-management').children?.[0].title).toBe('MANAGED_USERS.TITLE')
			expect(sectionOf('concepts').children?.[0].title).toBe('CASH_CONCEPTS.TITLE')
		})

		it('should give the sections that own an API their providers once, on the parent route', () => {
			expect(sectionOf('user-management').providers).toHaveLength(3)
			expect(sectionOf('concepts').providers).toHaveLength(3)

			for (const section of routeConfig) {
				for (const child of section.children ?? []) {
					expect(child.providers).toBeUndefined()
				}
			}
		})

		it('should not provide the office branch API or store again, the dashboard route owns them', () => {
			expect(sectionOf('office-branches').providers).toBeUndefined()
			expect(routeConfig[0].providers).toBeUndefined()
		})

		it.each([
			['user-management', Permission.SETTINGS_USERS_MANAGE],
			['concepts', Permission.SETTINGS_CASH_CONCEPTS_MANAGE],
		])('should guard %s with its management permission', (path, permission) => {
			const section = sectionOf(path)

			expect(section.canActivate).toEqual([permissionGuard])
			expect(section.data).toEqual({ requiredPermission: permission })
		})

		it('should guard only the branch creation page with a permission', () => {
			const [list, add] = sectionOf('office-branches').children ?? []

			expect(list.canActivate).toBeUndefined()
			expect(add.canActivate).toEqual([permissionGuard])
			expect(add.data).toEqual({ requiredPermission: Permission.SETTINGS_OFFICE_BRANCHES_MANAGE })
		})

		it('should never put the office branch guard in front of a settings page', () => {
			const guards = [routeConfig, ...routeConfig.map((route) => route.children ?? [])]
				.flat()
				.flatMap((route) => route.canActivate ?? [])

			expect(guards).not.toContain(officeBranchGuard)
		})
	})

	describe('navigation', () => {
		function configure(permissions: readonly string[]): void {
			TestBed.configureTestingModule({
				providers: [
					provideRouter([
						{ path: 'dashboard', component: DashboardStub },
						{ path: '', children: routeConfig },
					]),
					provideHttpClient(),
					provideHttpClientTesting(),
					provideAuthMock(),
					provideIdentityMock(),
					provideOfficeBranchMock(),
					provideSliceTranslationMock(settingsEn),
					...provideSignalFormsConfig({}),
				],
			})
			TestBed.inject(AuthStore).updateCurrentUser(
				createMockUser({ hasPermission: (identifier: string) => permissions.includes(identifier) }),
			)
		}

		it('should serve the home page at the root of the area', async () => {
			configure([])

			const page = await (await RouterTestingHarness.create()).navigateByUrl('/', SettingsHome)

			expect(page).toBeInstanceOf(SettingsHome)
		})

		it('should serve the branch list to any signed-in user', async () => {
			configure([])

			const page = await (await RouterTestingHarness.create()).navigateByUrl('/office-branches', OfficeBranches)

			expect(page).toBeInstanceOf(OfficeBranches)
		})

		it('should serve the branch creation page to a branch manager', async () => {
			configure([Permission.SETTINGS_OFFICE_BRANCHES_MANAGE])

			const page = await (await RouterTestingHarness.create()).navigateByUrl('/office-branches/add', AddOfficeBranch)

			expect(page).toBeInstanceOf(AddOfficeBranch)
		})

		it('should send a user who cannot manage branches away from the creation page', async () => {
			configure([])

			await (await RouterTestingHarness.create()).navigateByUrl('/office-branches/add')

			expect(TestBed.inject(Router).url).toBe('/dashboard')
			expect(TestBed.inject(UIStore).notifications()).toEqual([
				expect.objectContaining({ type: NotificationType.ERROR }),
			])
		})

		it('should serve user management wired to the HTTP user API through the section providers', async () => {
			configure([Permission.SETTINGS_USERS_MANAGE])
			const http = TestBed.inject(HttpTestingController)

			const page = await (await RouterTestingHarness.create()).navigateByUrl('/user-management', UserManagement)
			TestBed.tick()

			expect(page).toBeInstanceOf(UserManagement)
			http.expectOne(`${environment.apiUrl}/users`).flush([])
			http.verify()
		})

		it('should send a user who cannot manage users away from user management', async () => {
			configure([])
			const http = TestBed.inject(HttpTestingController)

			await (await RouterTestingHarness.create()).navigateByUrl('/user-management')

			expect(TestBed.inject(Router).url).toBe('/dashboard')
			http.expectNone(`${environment.apiUrl}/users`)
		})

		it('should serve the concepts page wired to the HTTP cash concept API through the section providers', async () => {
			configure([Permission.SETTINGS_CASH_CONCEPTS_MANAGE])
			const http = TestBed.inject(HttpTestingController)

			const page = await (await RouterTestingHarness.create()).navigateByUrl('/concepts', Concepts)
			TestBed.tick()

			expect(page).toBeInstanceOf(Concepts)
			http.expectOne(`${environment.apiUrl}/cash/transaction/get`).flush([])
			http.verify()
		})

		it('should send a user who cannot manage cash concepts away from the concepts page', async () => {
			configure([Permission.SETTINGS_USERS_MANAGE])
			const http = TestBed.inject(HttpTestingController)

			await (await RouterTestingHarness.create()).navigateByUrl('/concepts')

			expect(TestBed.inject(Router).url).toBe('/dashboard')
			http.expectNone(`${environment.apiUrl}/cash/transaction/get`)
		})
	})
})
