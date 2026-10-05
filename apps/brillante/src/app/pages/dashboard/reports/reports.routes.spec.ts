import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter, type Route } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { reportsEn } from '@providers/i18n/translations/slices/reports.translations'
import { provideOfficeBranchMock } from '@providers/office-branch/office-branch.mock'
import { clearAllMocks, spyOn, useFakeTimers, useRealTimers } from '@resetshop/util/test-utils'
import { environment } from '../../../environments/environment'
import CashReport from './cash-report/cash-report'
import ReportsHome from './reports-home/reports-home'
import routes from './reports.routes'

describe('reports routes', () => {
	const routeConfig: Route[] = routes

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
	})

	afterEach(() => {
		useRealTimers()
	})

	it('should declare one parent route that owns the section providers', () => {
		expect(routeConfig).toHaveLength(1)
		expect(routeConfig[0].providers).toHaveLength(2)
		expect(routeConfig[0].children).toHaveLength(2)
	})

	it('should not repeat providers on the child pages', () => {
		for (const child of routeConfig[0].children ?? []) {
			expect(child.providers).toBeUndefined()
		}
	})

	it('should title the pages with translation keys', () => {
		expect(routeConfig[0].children?.map((child) => child.title)).toEqual(['REPORTS.TITLE', 'REPORTS.CASH.TITLE'])
	})

	function configure(): void {
		TestBed.configureTestingModule({
			providers: [
				provideRouter(routeConfig),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideAuthMock(),
				provideOfficeBranchMock(),
				provideSliceTranslationMock(reportsEn),
				...provideSignalFormsConfig({}),
			],
		})
	}

	it('should serve the reports home', async () => {
		configure()

		const page = await (await RouterTestingHarness.create()).navigateByUrl('/', ReportsHome)

		expect(page).toBeInstanceOf(ReportsHome)
	})

	it('should serve the cash report wired to the HTTP report API through the parent providers', async () => {
		configure()
		const http = TestBed.inject(HttpTestingController)

		const page = await (await RouterTestingHarness.create()).navigateByUrl('/cash-report', CashReport)
		TestBed.tick()

		expect(page).toBeInstanceOf(CashReport)
		const request = http.expectOne((candidate) => candidate.url === `${environment.apiUrl}/cash`)
		expect(request.request.params.get('startDate')).toMatch(/ 00:00:00$/)
		request.flush([])
		http.verify()
	})
})
