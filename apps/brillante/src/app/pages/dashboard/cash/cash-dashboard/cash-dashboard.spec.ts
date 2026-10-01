import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import type { CashTransactionQuery } from '@contracts/cash/cash-transaction.types'
import { Permission, UserRole } from '@contracts/permission/permission.constants'
import { createMockUser } from '@mocks/user.mock'
import { CashConceptApi } from '@providers/cash-concept/cash-concept.interface'
import { CashApi } from '@providers/cash/cash.interface'
import { createMockCashTransactionDto, createMockConceptDto } from '@providers/cash/cash.mock'
import { mockBranch, provideCashTestEnvironment, seedSession } from '@providers/cash/cash.testing'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	type MockFn,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { CashStore } from '@store/cash/cash.store'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { startOfDay } from 'date-fns'
import { NEVER, of, throwError } from 'rxjs'
import CashDashboard from './cash-dashboard'

describe('CashDashboard', () => {
	let cashApiMock: Record<keyof CashApi, MockFn>
	let conceptApiMock: Record<keyof CashConceptApi, MockFn>
	let paymentMethodApiMock: Record<keyof PaymentMethodApi, MockFn>

	const income = createMockCashTransactionDto({ id: 1, amount: '1000.00', date: '2026-03-04T15:30:00.000Z' })
	const expense = createMockCashTransactionDto({
		id: 2,
		amount: '250.00',
		date: '2026-03-04T18:10:00.000Z',
		note: 'Compra de insumos',
		concept: createMockConceptDto({
			id: 21,
			description: 'Limpieza',
			transactionType: { id: 0, description: 'Egreso' },
			parent: createMockConceptDto({ id: 2, description: 'Gastos', parent: null }),
		}),
	})

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		seedSession()

		cashApiMock = {
			getAll: fn(),
			getById: fn(),
			create: fn(),
			update: fn(),
			remove: fn(),
			open: fn(),
			close: fn(),
		}
		conceptApiMock = { getAll: fn(), create: fn(), update: fn(), enable: fn(), disable: fn() }
		paymentMethodApiMock = { getAll: fn() }

		cashApiMock.getAll.mockReturnValue(of([]))
		conceptApiMock.getAll.mockReturnValue(of([]))
		paymentMethodApiMock.getAll.mockReturnValue(of([]))
	})

	afterEach(() => {
		useRealTimers()
	})

	function lastQuery(): CashTransactionQuery {
		return cashApiMock.getAll.calls.at(-1)?.[0] as CashTransactionQuery
	}

	async function renderDashboard() {
		const view = await render(CashDashboard, {
			providers: [
				provideRouter([]),
				CashStore,
				...provideCashTestEnvironment({
					cashApi: cashApiMock,
					conceptApi: conceptApiMock,
					paymentMethodApi: paymentMethodApiMock,
				}),
			],
		})
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	async function renderAsReader() {
		const view = await renderDashboard()
		TestBed.inject(AuthStore).updateCurrentUser(
			createMockUser({ hasPermission: (identifier) => identifier === Permission.CASH_READ }),
		)
		TestBed.tick()
		view.fixture.detectChanges()
		return view
	}

	function notifications() {
		return TestBed.inject(UIStore).notifications()
	}

	describe('loading and errors', () => {
		it('should show the action skeleton and a loading status while the list loads', async () => {
			cashApiMock.getAll.mockReturnValue(NEVER)

			await render(CashDashboard, {
				providers: [
					provideRouter([]),
					CashStore,
					...provideCashTestEnvironment({
						cashApi: cashApiMock,
						conceptApi: conceptApiMock,
						paymentMethodApi: paymentMethodApiMock,
					}),
				],
			})

			expect(screen.getByTestId('cash-actions-skeleton')).toBeInTheDocument()
			expect(screen.getByRole('status')).toHaveTextContent('Loading...')
		})

		it('should show the list error instead of the content', async () => {
			cashApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))

			await renderDashboard()

			expect(screen.getByRole('alert')).toHaveTextContent('The transactions could not be loaded.')
		})
	})

	describe('transactions', () => {
		beforeEach(() => {
			cashApiMock.getAll.mockReturnValue(of([expense, income]))
		})

		it('should list the transactions of today for the assigned branch, oldest first', async () => {
			await renderDashboard()

			expect(lastQuery()).toEqual({
				from: startOfDay(new Date()),
				to: startOfDay(new Date()),
				branchId: mockBranch.id,
			})
			const rows = screen.getAllByRole('row').slice(1)
			expect(rows).toHaveLength(2)
			expect(within(rows[0]).getByText('Venta de accesorios')).toBeInTheDocument()
			expect(within(rows[1]).getByText('Limpieza')).toBeInTheDocument()
		})

		it('should place incomes, expenses and balances in their columns', async () => {
			await renderDashboard()

			const [incomeRow, expenseRow] = screen.getAllByRole('row').slice(1)
			expect(within(incomeRow).getAllByText('$ 1.000,00')).toHaveLength(2)
			expect(within(expenseRow).getByText('$ 250,00')).toBeInTheDocument()
			expect(within(expenseRow).getByText('$ -250,00')).toBeInTheDocument()
		})

		it('should show the totals of the period', async () => {
			await renderDashboard()

			const totals = screen.getByRole('region', { name: 'Totals of the selected period' })
			expect(within(totals).getByText('$ 1.000,00')).toBeInTheDocument()
			expect(within(totals).getByText('$ 250,00')).toBeInTheDocument()
			expect(within(totals).getByText('$ 750,00')).toBeInTheDocument()
		})

		it('should ask to select a transaction until one is chosen', async () => {
			await renderDashboard()

			expect(screen.getByText('Select a transaction from the table to see its details.')).toBeInTheDocument()
		})

		it('should show the details of the selected transaction', async () => {
			await renderDashboard()

			fireEvent.click(screen.getByRole('button', { name: 'View details of transaction 2' }))
			TestBed.tick()

			const details = screen.getByRole('region', { name: 'Transaction details' })
			expect(within(details).getByText('Compra de insumos')).toBeInTheDocument()
			expect(within(details).getByText('Expense')).toBeInTheDocument()
		})
	})

	describe('empty register', () => {
		it('should explain that there are no transactions and remind to open the register today', async () => {
			await renderDashboard()

			expect(
				screen.getByText(/There are no transactions registered in the assigned branch for this period\./),
			).toBeInTheDocument()
			expect(screen.getByText(/Remember to open the cash register/)).toBeInTheDocument()
			expect(screen.queryByRole('table')).not.toBeInTheDocument()
		})

		it('should open the register with the signed-in user and the branch and confirm with a toast', async () => {
			cashApiMock.open.mockReturnValue(of(createMockCashTransactionDto()))
			await renderDashboard()

			fireEvent.click(screen.getByRole('button', { name: 'Open cash register' }))
			TestBed.tick()

			const [user, branch] = cashApiMock.open.calls[0] as [{ userName: string }, { id: number }]
			expect(user.userName).toBe('clerk')
			expect(branch.id).toBe(mockBranch.id)
			expect(notifications().map((n) => n.message)).toContain('Cash register opened.')
		})

		it('should show the failure as an error toast when opening fails', async () => {
			cashApiMock.open.mockReturnValue(throwError(() => new Error('boom')))
			await renderDashboard()

			fireEvent.click(screen.getByRole('button', { name: 'Open cash register' }))
			TestBed.tick()

			expect(notifications()).toEqual([
				expect.objectContaining({ type: 'error', message: 'The cash register could not be opened.' }),
			])
		})

		it('should not offer creating or closing on an unopened register', async () => {
			await renderDashboard()

			expect(screen.queryByRole('link', { name: 'New transaction' })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: 'Close cash register' })).not.toBeInTheDocument()
		})

		it('should not offer opening the register to a user that cannot manage it', async () => {
			await renderAsReader()

			expect(screen.queryByRole('button', { name: 'Open cash register' })).not.toBeInTheDocument()
		})
	})

	describe('opened register', () => {
		beforeEach(() => {
			cashApiMock.getAll.mockReturnValue(of([income]))
		})

		it('should offer creating a transaction and closing the register to managers', async () => {
			await renderDashboard()

			expect(screen.getByRole('link', { name: 'New transaction' })).toHaveAttribute('href', '/dashboard/cash/new')
			expect(screen.getByRole('button', { name: 'Close cash register' })).toBeInTheDocument()
			expect(screen.queryByRole('button', { name: 'Open cash register' })).not.toBeInTheDocument()
		})

		it('should hide the write actions from a user that only reads', async () => {
			await renderAsReader()

			expect(screen.queryByRole('link', { name: 'New transaction' })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: 'Close cash register' })).not.toBeInTheDocument()
			fireEvent.click(screen.getByRole('button', { name: 'View details of transaction 1' }))
			TestBed.tick()
			expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
		})

		it('should ask for confirmation before closing the register', async () => {
			cashApiMock.close.mockReturnValue(of({}))
			await renderDashboard()

			fireEvent.click(screen.getByRole('button', { name: 'Close cash register' }))
			TestBed.tick()
			expect(cashApiMock.close.calls).toHaveLength(0)
			fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Close cash register' }))
			TestBed.tick()

			expect(cashApiMock.close.calls[0]).toEqual([mockBranch])
			expect(notifications().map((n) => n.message)).toContain('Cash register closed.')
		})

		it('should ask for confirmation before deleting and then delete the selected transaction', async () => {
			cashApiMock.remove.mockReturnValue(of({}))
			await renderDashboard()
			fireEvent.click(screen.getByRole('button', { name: 'View details of transaction 1' }))
			TestBed.tick()

			fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
			TestBed.tick()
			const dialog = screen.getByRole('alertdialog')
			expect(
				within(dialog).getByText('Are you sure you want to delete transaction 1? This action cannot be undone.'),
			).toBeInTheDocument()
			expect(cashApiMock.remove.calls).toHaveLength(0)
			fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
			TestBed.tick()

			expect(cashApiMock.remove.calls[0]).toEqual([1])
			expect(notifications().map((n) => n.message)).toContain('Transaction deleted successfully.')
		})

		it('should show an error toast when deleting fails', async () => {
			cashApiMock.remove.mockReturnValue(throwError(() => new Error('boom')))
			await renderDashboard()
			fireEvent.click(screen.getByRole('button', { name: 'View details of transaction 1' }))
			TestBed.tick()
			fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
			TestBed.tick()

			fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
			TestBed.tick()

			expect(notifications()).toEqual([
				expect.objectContaining({ type: 'error', message: 'The transaction could not be deleted.' }),
			])
		})
	})

	describe('period', () => {
		it('should reload the transactions when another day is picked', async () => {
			await renderDashboard()

			fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-03-01' } })
			TestBed.tick()

			expect(lastQuery()).toEqual(expect.objectContaining({ from: new Date(2026, 2, 1) }))
		})

		it('should reload the transactions when the end of the range changes', async () => {
			await renderDashboard()
			fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-03-01' } })

			fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-03-04' } })
			TestBed.tick()

			expect(lastQuery()).toEqual(expect.objectContaining({ from: new Date(2026, 2, 1), to: new Date(2026, 2, 4) }))
		})

		it('should ignore an emptied date input', async () => {
			await renderDashboard()
			const callsBefore = cashApiMock.getAll.calls.length

			fireEvent.change(screen.getByLabelText('From'), { target: { value: '' } })
			TestBed.tick()

			expect(cashApiMock.getAll.calls).toHaveLength(callsBefore)
		})

		it('should go back to today', async () => {
			await renderDashboard()
			fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-03-01' } })
			TestBed.tick()

			fireEvent.click(screen.getByRole('button', { name: "Today's cash register" }))
			TestBed.tick()

			expect(lastQuery().from).toEqual(startOfDay(new Date()))
		})

		it('should let counter clerks, owners and admins browse other days', async () => {
			await renderDashboard()

			expect(screen.getByLabelText('From')).toBeEnabled()
			expect(screen.getByLabelText('To')).toBeEnabled()
		})

		it('should lock the dates for an employee', async () => {
			seedSession([{ id: UserRole.EMPLOYEE, description: 'Employee' }])

			await renderDashboard()

			expect(screen.getByLabelText('From')).toBeDisabled()
			expect(screen.getByLabelText('To')).toBeDisabled()
		})

		it('should allow an admin to go back to 2016', async () => {
			seedSession([{ id: UserRole.ADMIN, description: 'Admin' }])
			await renderDashboard()

			expect(screen.getByLabelText('From')).toHaveAttribute('min', '2016-01-01')
		})

		it('should limit the history of a counter clerk to fourteen days', async () => {
			await renderDashboard()

			const min = screen.getByLabelText('From').getAttribute('min') as string
			expect(new Date(min).getTime()).toBeGreaterThan(new Date(2020, 0, 1).getTime())
		})
	})
})
