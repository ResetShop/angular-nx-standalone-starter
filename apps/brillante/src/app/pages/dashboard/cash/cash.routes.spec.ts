import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter, type Route } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { provideOfficeBranchMock } from '@providers/office-branch/office-branch.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { useFakeTimers, useRealTimers } from '@resetshop/util/test-utils'
import { environment } from '../../../environments/environment'
import CashDashboard from './cash-dashboard/cash-dashboard'
import routes from './cash.routes'
import { cashTranslation, readOnlyCashUser, signInAndAssignBranch } from './cash.testing'

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
		expect(routes[0].children).toHaveLength(1)
	})

	it('does not repeat providers on the child pages', () => {
		for (const child of (routes[0].children ?? []) as Route[]) {
			expect(child.providers).toBeUndefined()
		}
	})

	it('titles every page with a translation key', () => {
		expect(routes[0].children?.map((child) => child.title)).toEqual(['CASH.PAGE.TITLE'])
	})

	it('exposes no standalone create or edit routes', () => {
		expect((routes[0].children ?? []).map((child) => child.path)).toEqual([''])
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

	it('serves the dashboard to a user that can manage the register', async () => {
		const http = configure()
		signInAndAssignBranch()

		const page = await RouterTestingHarness.create().then((harness) => harness.navigateByUrl('/', CashDashboard))
		TestBed.tick()

		expect(page).toBeInstanceOf(CashDashboard)
		flushSectionLoads(http)
		http.verify()
	})
})
