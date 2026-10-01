import { TestBed } from '@angular/core/testing'
import type { CashTransactionRequest } from '@contracts/cash/cash-transaction.types'
import { toCashTransaction } from '@domain/cash/cash-transaction.mapper'
import { CashConceptApi } from '@providers/cash-concept/cash-concept.interface'
import { CashApi } from '@providers/cash/cash.interface'
import {
	createMockCashTransactionDto,
	createMockConceptDto,
	createMockPaymentMethodDto,
} from '@providers/cash/cash.mock'
import { provideCashTestEnvironment, seedSession } from '@providers/cash/cash.testing'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import { DRAWER_SPINNER_MIN_DISPLAY } from '@resetshop/ui/drawer/drawer-loading'
import { parseDurationToMs } from '@resetshop/util'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	type MockFn,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { CashStore } from '@store/cash/cash.store'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../cash.constants'
import { CashTransactionDrawer } from './cash-transaction-drawer'

describe('CashTransactionDrawer', () => {
	let cashApiMock: Record<keyof CashApi, MockFn>
	let conceptApiMock: Record<keyof CashConceptApi, MockFn>
	let paymentMethodApiMock: Record<keyof PaymentMethodApi, MockFn>

	const parent = createMockConceptDto({ id: 1, description: 'Ventas', parent: null })
	const child = createMockConceptDto({ id: 11, description: 'Accesorios', parent })
	const tree = [{ ...parent, children: [child] }]
	const transaction = toCashTransaction(
		createMockCashTransactionDto({ id: 7, concept: child, note: 'Venta de mostrador' }),
	)

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
		conceptApiMock.getAll.mockReturnValue(of(tree))
		paymentMethodApiMock.getAll.mockReturnValue(of([createMockPaymentMethodDto()]))
	})

	afterEach(() => {
		useRealTimers()
	})

	async function renderDrawer() {
		const view = await render(CashTransactionDrawer, {
			providers: [
				CashStore,
				...provideCashTestEnvironment({
					cashApi: cashApiMock,
					conceptApi: conceptApiMock,
					paymentMethodApi: paymentMethodApiMock,
				}),
			],
		})
		TestBed.tick()
		return view
	}

	async function settle(fixture: { detectChanges(): void }, ms = parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY)) {
		await advanceTimersByTimeAsync(ms)
		fixture.detectChanges()
	}

	async function openCreate() {
		const view = await renderDrawer()
		view.fixture.componentInstance.openCreate()
		await settle(view.fixture)
		return view
	}

	async function openEdit(target = transaction) {
		const view = await renderDrawer()
		view.fixture.componentInstance.openEdit(target)
		await settle(view.fixture)
		return view
	}

	function fillValidForm(): void {
		fireEvent.input(screen.getByLabelText('Amount'), { target: { value: '1500' } })
		fireEvent.input(screen.getByLabelText(/^Note/), { target: { value: 'Venta de mostrador' } })
		TestBed.tick()
	}

	function save(name: string): void {
		fireEvent.click(screen.getByRole('button', { name }))
		TestBed.tick()
	}

	/** The drawer reports it finished closing on the dialog's transitionend. */
	async function finishClosing(fixture: { detectChanges(): void }): Promise<void> {
		fireEvent.transitionEnd(screen.getByRole('dialog', { hidden: true }))
		await settle(fixture)
	}

	function notifications() {
		return TestBed.inject(UIStore).notifications()
	}

	describe('create mode', () => {
		it('should render the create form with the signed-in user', async () => {
			await openCreate()

			expect(screen.getByRole('heading', { name: 'Create transaction' })).toBeInTheDocument()
			expect(screen.getByLabelText('Amount')).toBeInTheDocument()
			expect(screen.getByText('clerk')).toBeInTheDocument()
		})

		it('should show a loading status while the catalogues load', async () => {
			conceptApiMock.getAll.mockReturnValue(NEVER)

			await openCreate()

			expect(screen.getByRole('status')).toHaveTextContent('Loading the form data...')
			expect(screen.queryByLabelText('Amount')).not.toBeInTheDocument()
		})

		it('should show the error when the concepts cannot be loaded', async () => {
			conceptApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))

			await openCreate()

			expect(screen.getByRole('alert')).toHaveTextContent('The transaction concepts could not be loaded.')
		})

		it('should show the error when the payment methods cannot be loaded', async () => {
			paymentMethodApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))

			await openCreate()

			expect(screen.getByRole('alert')).toHaveTextContent('The payment methods could not be loaded.')
		})

		it('should keep saving disabled until the form is valid', async () => {
			await openCreate()
			expect(screen.getByRole('button', { name: 'Save transaction' })).toBeDisabled()

			fillValidForm()

			expect(screen.getByRole('button', { name: 'Save transaction' })).toBeEnabled()
		})

		it('should create the transaction with the filled values', async () => {
			cashApiMock.create.mockReturnValue(of([createMockCashTransactionDto()]))
			await openCreate()

			fillValidForm()
			save('Save transaction')

			const [request, user, branch] = cashApiMock.create.calls[0] as [
				CashTransactionRequest,
				{ userName: string },
				{ id: number },
			]
			expect(request.concept.id).toBe(11)
			expect(request.amount).toBe(1500)
			expect(request.note).toBe('Venta de mostrador')
			expect(request.payments).toHaveLength(1)
			expect(user.userName).toBe('clerk')
			expect(branch.id).toBe(2)
		})

		it('should close and confirm with a toast once the transaction is created', async () => {
			cashApiMock.create.mockReturnValue(of([createMockCashTransactionDto()]))
			const { fixture } = await openCreate()

			fillValidForm()
			save('Save transaction')
			expect(notifications()).toEqual([])
			await settle(fixture, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
			await finishClosing(fixture)

			expect(notifications()).toEqual([
				expect.objectContaining({ type: 'success', message: 'Transaction created successfully.' }),
			])
			expect(screen.queryByLabelText('Amount')).not.toBeInTheDocument()
		})

		it('should keep the drawer open and show the failure inline when creating fails', async () => {
			cashApiMock.create.mockReturnValue(throwError(() => new Error('boom')))
			await openCreate()

			fillValidForm()
			save('Save transaction')

			expect(screen.getByRole('alert')).toHaveTextContent('The transaction could not be created.')
			expect(notifications()).toEqual([])
			expect(screen.getByLabelText('Amount')).toBeInTheDocument()
		})

		it('should open with an empty form after a previous creation', async () => {
			cashApiMock.create.mockReturnValue(of([createMockCashTransactionDto()]))
			const { fixture } = await openCreate()
			fillValidForm()
			save('Save transaction')
			await settle(fixture, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
			await finishClosing(fixture)

			fixture.componentInstance.openCreate()
			await settle(fixture)

			expect(screen.getByLabelText(/^Note/)).toHaveValue('')
			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})
	})

	describe('edit mode', () => {
		it('should prefill the form with the transaction', async () => {
			await openEdit()

			expect(screen.getByRole('heading', { name: 'Edit transaction' })).toBeInTheDocument()
			expect(screen.getByLabelText(/^Note/)).toHaveValue('Venta de mostrador')
			expect(screen.getByLabelText('Amount')).toHaveValue(1500)
			expect(screen.getByLabelText('Date and time')).toBeInTheDocument()
		})

		it('should send the edited transaction with its id', async () => {
			cashApiMock.update.mockReturnValue(of([1]))
			await openEdit()

			fireEvent.input(screen.getByLabelText(/^Note/), { target: { value: 'Nota corregida del mostrador' } })
			TestBed.tick()
			save('Save changes')

			const [request, user] = cashApiMock.update.calls[0] as [CashTransactionRequest, { userName: string }]
			expect(request.id).toBe(7)
			expect(request.note).toBe('Nota corregida del mostrador')
			expect(request.concept.id).toBe(11)
			expect(user.userName).toBe('clerk')
		})

		it('should close and confirm with a toast once the transaction is updated', async () => {
			cashApiMock.update.mockReturnValue(of([1]))
			const { fixture } = await openEdit()

			save('Save changes')
			await settle(fixture, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
			await finishClosing(fixture)

			expect(notifications()).toEqual([
				expect.objectContaining({ type: 'success', message: 'Transaction updated successfully.' }),
			])
		})

		it('should keep the drawer open and show the failure inline when updating fails', async () => {
			cashApiMock.update.mockReturnValue(throwError(() => new Error('boom')))
			await openEdit()

			save('Save changes')

			expect(screen.getByRole('alert')).toHaveTextContent('The transaction could not be updated.')
			expect(notifications()).toEqual([])
		})

		it('should explain that a system generated transaction cannot be edited', async () => {
			const systemParent = createMockConceptDto({ id: 1, userAssignable: false, parent: null })
			const generated = toCashTransaction(
				createMockCashTransactionDto({ id: 7, concept: createMockConceptDto({ id: 11, parent: systemParent }) }),
			)

			await openEdit(generated)

			expect(screen.getByText('This transaction was generated by the system and cannot be edited.')).toBeInTheDocument()
			expect(screen.queryByLabelText('Amount')).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
		})

		it('should explain that a transaction whose concept is no longer assignable cannot be edited', async () => {
			conceptApiMock.getAll.mockReturnValue(of([]))

			await openEdit()

			expect(screen.getByText('This transaction was generated by the system and cannot be edited.')).toBeInTheDocument()
		})
	})

	describe('discarding', () => {
		it('should close without asking when nothing was changed', async () => {
			const { fixture } = await openCreate()

			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
			TestBed.tick()
			await finishClosing(fixture)

			expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
			expect(screen.queryByLabelText('Amount')).not.toBeInTheDocument()
			expect(cashApiMock.create.calls).toHaveLength(0)
		})

		it('should ask for confirmation before discarding a dirty form', async () => {
			await openCreate()
			fillValidForm()

			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
			TestBed.tick()

			const dialog = screen.getByRole('alertdialog')
			expect(within(dialog).getByText('Discard changes')).toBeInTheDocument()
			expect(screen.getByLabelText('Amount')).toBeInTheDocument()
		})

		it('should close the drawer without saving once the discard is confirmed', async () => {
			const { fixture } = await openCreate()
			fillValidForm()
			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
			TestBed.tick()

			fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Discard' }))
			TestBed.tick()
			await finishClosing(fixture)

			expect(screen.queryByLabelText('Amount')).not.toBeInTheDocument()
			expect(cashApiMock.create.calls).toHaveLength(0)
			expect(notifications()).toEqual([])
		})
	})
})
