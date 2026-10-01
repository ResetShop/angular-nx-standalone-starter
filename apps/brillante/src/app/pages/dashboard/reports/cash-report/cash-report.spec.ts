import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { formatReportDay } from '@domain/report/cash-report.format'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { reportsEn } from '@providers/i18n/translations/slices/reports.translations'
import { InMemoryOfficeBranchApi, provideOfficeBranchMock } from '@providers/office-branch/office-branch.mock'
import { createMockCashReportTransaction, InMemoryReportApi, provideReportMock } from '@providers/report/report.mock'
import {
	advanceTimersByTime,
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import CashReport from './cash-report'

describe('CashReport', () => {
	let reportApi: InMemoryReportApi
	let branchApi: InMemoryOfficeBranchApi

	const income = createMockCashReportTransaction({ id: 1, amount: '1500.50' })
	const expense = createMockCashReportTransaction({
		id: 2,
		amount: '200',
		note: 'Monthly rent',
		paymentMethod: { id: 2, description: 'Mercado Pago' },
		concept: {
			id: 20,
			description: 'Rent',
			transactionType: { id: 0, description: 'Egreso' },
			parent: { id: 3, description: 'Fixed costs' },
		},
	})

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		reportApi = new InMemoryReportApi()
		branchApi = new InMemoryOfficeBranchApi()
		branchApi.seed([
			{ id: 1, name: 'Centro', address: 'San Martin 100' },
			{ id: 4, name: 'Norte', address: 'Belgrano 200' },
		])
		localStorage.clear()
	})

	afterEach(() => {
		useRealTimers()
		localStorage.clear()
	})

	async function renderPage() {
		const view = await render(CashReport, {
			providers: [
				provideReportMock(reportApi),
				provideOfficeBranchMock(branchApi),
				provideSliceTranslationMock(reportsEn),
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	function setDate(view: { fixture: { detectChanges(): void } }, label: RegExp, value: string): void {
		fireEvent.input(screen.getByLabelText(label), { target: { value } })
		view.fixture.detectChanges()
	}

	it('should generate the report of today for every branch when the page opens', async () => {
		await renderPage()

		const today = formatReportDay(new Date())
		expect(reportApi.lastRequest).toEqual({ startDate: today, endDate: today })
		expect(screen.getByLabelText(/^From/)).toHaveValue(today)
		expect(screen.getByLabelText(/^To/)).toHaveValue(today)
	})

	it('should tell the user when the period has no movements', async () => {
		await renderPage()

		expect(screen.getByTestId('report-empty')).toHaveTextContent('There are no cash movements in the selected period.')
		expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument()
	})

	describe('with movements', () => {
		beforeEach(() => reportApi.seed([expense, income]))

		it('should list every movement ordered by id', async () => {
			await renderPage()

			const table = screen.getByRole('table', { name: 'Cash movements of the selected period' })
			const rows = within(table).getAllByRole('row').slice(1)
			expect(rows).toHaveLength(2)
			expect(within(rows[0]).getAllByRole('cell')[0]).toHaveTextContent('1')
			expect(rows[1]).toHaveTextContent('Monthly rent')
			expect(rows[1]).toHaveTextContent('Mercado Pago')
			expect(rows[1]).toHaveTextContent('Fixed costs')
		})

		it('should show the income, expense and balance totals', async () => {
			await renderPage()

			expect(screen.getByTestId('total-income')).toHaveTextContent('1,500.50')
			expect(screen.getByTestId('total-expense')).toHaveTextContent('200.00')
			expect(screen.getByTestId('total-balance')).toHaveTextContent('1,300.50')
		})

		it('should break the totals down by concept', async () => {
			await renderPage()

			const table = screen.getByRole('table', { name: 'By concept' })
			expect(within(within(table).getByRole('row', { name: /^Services/ })).getAllByRole('cell')[1]).toHaveTextContent(
				'1',
			)
			expect(within(table).getByRole('row', { name: /^Fixed costs/ })).toHaveTextContent('200.00')
		})

		it('should break the totals down by payment method', async () => {
			await renderPage()

			const table = screen.getByRole('table', { name: 'By payment method' })
			expect(within(table).getByRole('row', { name: /^Efectivo/ })).toHaveTextContent('1,500.50')
			expect(within(table).getByRole('row', { name: /^Mercado Pago/ })).toHaveTextContent('200.00')
		})

		it('should export the report as a csv named after the period', async () => {
			const originalCreateObjectUrl = URL.createObjectURL
			const originalRevokeObjectUrl = URL.revokeObjectURL
			const createObjectUrl = fn<[Blob], string>()
			createObjectUrl.mockReturnValue('blob:report')
			URL.createObjectURL = createObjectUrl
			URL.revokeObjectURL = fn<[string], void>()
			const downloads: string[] = []
			spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
				downloads.push(this.download)
			})
			const view = await renderPage()

			fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }))
			view.fixture.detectChanges()

			const today = formatReportDay(new Date())
			expect(downloads).toEqual([`Brillante cash report (${today} - ${today}).csv`])
			const csv = await createObjectUrl.calls[0][0].text()
			expect(csv).toContain('ID,Date and time,Branch,Concept,Subconcept,Note,Method,Income,Expense,Balance,Created by')
			expect(csv).toContain('Monthly rent')
			URL.createObjectURL = originalCreateObjectUrl
			URL.revokeObjectURL = originalRevokeObjectUrl
		})
	})

	describe('filters', () => {
		it('should request the chosen period when generating', async () => {
			const view = await renderPage()

			setDate(view, /^From/, '2026-03-01')
			setDate(view, /^To/, '2026-03-31')
			fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
			view.fixture.detectChanges()

			expect(reportApi.lastRequest).toEqual({ startDate: '2026-03-01', endDate: '2026-03-31' })
		})

		it('should request only the chosen branch', async () => {
			const view = await renderPage()
			const user = userEvent.setup({ advanceTimers: (ms) => advanceTimersByTime(ms) })

			await user.click(screen.getByRole('combobox'))
			await user.click(screen.getByText('Norte'))
			view.fixture.detectChanges()
			fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
			view.fixture.detectChanges()

			expect(reportApi.lastRequest).toMatchObject({ branchId: 4 })
		})

		it('should offer every branch plus an option for all of them', async () => {
			const view = await renderPage()
			const user = userEvent.setup({ advanceTimers: (ms) => advanceTimersByTime(ms) })

			await user.click(screen.getByRole('combobox'))
			view.fixture.detectChanges()

			expect(screen.getByRole('combobox')).toHaveTextContent('All branches')
			expect(screen.getByText('Centro')).toBeInTheDocument()
			expect(screen.getByText('Norte')).toBeInTheDocument()
		})

		it('should refuse a period that ends before it starts', async () => {
			const view = await renderPage()
			const requestsBefore = reportApi.lastRequest

			setDate(view, /^From/, '2026-03-10')
			setDate(view, /^To/, '2026-03-01')

			expect(screen.getByRole('alert')).toHaveTextContent('The end date cannot be earlier than the start date.')
			expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled()

			fireEvent.submit(screen.getByRole('button', { name: 'Generate' }))
			expect(reportApi.lastRequest).toBe(requestsBefore)
		})

		it('should not generate without a date', async () => {
			const view = await renderPage()

			setDate(view, /^From/, '')

			expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled()
		})
	})

	it('should show the error and no results when the report cannot be loaded', async () => {
		reportApi.setError('getCashTransactions', new Error('boom'))

		await renderPage()

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to load the cash report')
		expect(screen.queryByTestId('report-prompt')).not.toBeInTheDocument()
		expect(screen.queryByTestId('report-empty')).not.toBeInTheDocument()
	})
})
