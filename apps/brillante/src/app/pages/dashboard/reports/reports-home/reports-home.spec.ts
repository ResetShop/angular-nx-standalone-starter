import { provideRouter } from '@angular/router'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { reportsEn } from '@providers/i18n/translations/slices/reports.translations'
import { advanceTimersByTimeAsync, clearAllMocks, useFakeTimers, useRealTimers } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import ReportsHome from './reports-home'

describe('ReportsHome', () => {
	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
	})

	afterEach(() => {
		useRealTimers()
	})

	async function renderPage() {
		const view = await render(ReportsHome, {
			providers: [provideRouter([]), provideSliceTranslationMock(reportsEn)],
		})
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
	}

	it('should render the title and description', async () => {
		await renderPage()

		expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument()
		expect(screen.getByText('Review how the business is doing.')).toBeInTheDocument()
	})

	it('should link to the cash report', async () => {
		await renderPage()

		expect(screen.getByRole('link', { name: /^Cash reports/ })).toHaveAttribute(
			'href',
			'/dashboard/reports/cash-report',
		)
	})
})
