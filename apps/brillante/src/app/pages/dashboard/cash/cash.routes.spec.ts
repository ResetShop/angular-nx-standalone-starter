import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter, type Route, Router } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { Permission } from '@contracts/permission/permission.constants'
import { permissionGuard } from '@guards/permission.guard'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { cashTranslation, readOnlyCashUser, signInAndAssignBranch } from '@providers/cash/cash.testing'
import { provideIdentityMock } from '@providers/identity/identity.mock'
import { provideOfficeBranchMock } from '@providers/office-branch/office-branch.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { useFakeTimers, useRealTimers } from '@resetshop/util/test-utils'
import { environment } from '../../../environments/environment'
import CashCreate from './cash-create/cash-create'
import CashDashboard from './cash-dashboard/cash-dashboard'
import CashEdit from './cash-edit/cash-edit'
import routes from './cash.routes'

@Component({ selector: 'app-blank', standalone: true, template: '' })
class Blank {}

describe('cash routes', () => {
	beforeEach(() => {
		useFakeTimers()
		localStorage.clear()
	})

	afterEach(() => {
		useRealTimers()
	})

	function configure(): HttpTestingController {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([...routes, { path: 'dashboard', component: Blank }]),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideAuthMock(),
				provideIdentityMock(),
				provideOfficeBranchMock(),
				{ provide: Translation, useValue: cashTranslation },
			],
		})
		return TestBed.inject(HttpTestingController)
	}

	function flushSectionLoads(http: HttpTestingController): void {
		http.expectOne(`${environment.apiUrl}/cash/transaction/get`).flush([])
		http.expectOne(`${environment.apiUrl}/cash/getPaymentMethods`).flush([])
		http.expectOne((request) => request.url === `${environment.apiUrl}/cash`).flush([])
	}

	it('declares one parent route that owns the section providers', () => {
		expect(routes).toHaveLength(1)
		expect(routes[0].providers).toHaveLength(5)
		expect(routes[0].children).toHaveLength(3)
	})

	it('does not repeat providers on the child pages', () => {
		for (const child of (routes[0].children ?? []) as Route[]) {
			expect(child.providers).toBeUndefined()
		}
	})

	it('titles every page with a translation key', () => {
		expect(routes[0].children?.map((child) => child.title)).toEqual([
			'CASH.PAGE.TITLE',
			'CASH.FORM.CREATE_TITLE',
			'CASH.FORM.EDIT_TITLE',
		])
	})

	it('requires the manage permission on the write routes', () => {
		const writeRoutes = (routes[0].children ?? []).filter((child) => child.path !== '')

		expect(writeRoutes.map((route) => route.path)).toEqual(['new', ':id/edit'])
		for (const route of writeRoutes) {
			expect(route.canActivate).toEqual([permissionGuard])
			expect(route.data).toEqual({ requiredPermission: Permission.CASH_MANAGE })
		}
	})

	it('serves the dashboard wired to the HTTP APIs through the parent providers', async () => {
		const http = configure()
		signInAndAssignBranch(readOnlyCashUser())

		const page = await RouterTestingHarness.create().then((harness) => harness.navigateByUrl('/', CashDashboard))
		TestBed.tick()

		expect(page).toBeInstanceOf(CashDashboard)
		flushSectionLoads(http)
		http.verify()
	})

	it('lets a user that can manage the register reach the create page', async () => {
		const http = configure()
		signInAndAssignBranch()

		const harness = await RouterTestingHarness.create()
		const page = await harness.navigateByUrl('/new', CashCreate)
		TestBed.tick()

		expect(page).toBeInstanceOf(CashCreate)
		flushSectionLoads(http)
		http.verify()
	})

	it('lets a user that can manage the register reach the edit page and loads the transaction', async () => {
		const http = configure()
		signInAndAssignBranch()

		const harness = await RouterTestingHarness.create()
		const page = await harness.navigateByUrl('/5/edit', CashEdit)
		TestBed.tick()

		expect(page).toBeInstanceOf(CashEdit)
		flushSectionLoads(http)
		http.expectOne(`${environment.apiUrl}/cash/getById/5`).flush(null, { status: 500, statusText: 'Server Error' })
		http.verify()
	})

	it('sends a read-only user away from the create page', async () => {
		const http = configure()
		signInAndAssignBranch(readOnlyCashUser())

		const harness = await RouterTestingHarness.create()
		await harness.navigateByUrl('/new')

		expect(TestBed.inject(Router).url).toBe('/dashboard')
		http.verify()
	})

	it('sends a read-only user away from the edit page', async () => {
		const http = configure()
		signInAndAssignBranch(readOnlyCashUser())

		const harness = await RouterTestingHarness.create()
		await harness.navigateByUrl('/5/edit')

		expect(TestBed.inject(Router).url).toBe('/dashboard')
		http.verify()
	})
})
