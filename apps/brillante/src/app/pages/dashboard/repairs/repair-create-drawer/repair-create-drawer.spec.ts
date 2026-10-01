import { HttpErrorResponse } from '@angular/common/http'
import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { CustomerApi } from '@providers/customer/customer.interface'
import { provideIdentityMock } from '@providers/identity/identity.mock'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import { RepairApi } from '@providers/repair/repair.interface'
import { MOCK_REPAIR_STATUSES } from '@providers/repair/repair.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
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
import { AuthStore } from '@store/auth/auth.store'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen } from '@testing-library/angular'
import { of, throwError } from 'rxjs'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../repairs.constants'
import { createPaymentMethodApiMock, createRepairApiMock } from '../testing/repair-api.mock'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import { RepairCreateDrawer } from './repair-create-drawer'

const CUSTOMER = {
	id: 7,
	dni: 30123456,
	firstName: 'Ada',
	lastName: 'Lovelace',
	email: 'ada@example.com',
	birthDate: null,
	address: 'Calle Falsa 123',
	telephone: '3425551234',
}

describe('RepairCreateDrawer', () => {
	let repairApiMock: Record<keyof RepairApi, MockFn>
	let customerApiMock: Record<keyof CustomerApi, MockFn>
	let paymentMethodApiMock: Record<keyof PaymentMethodApi, MockFn>

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		spyOn(console, 'error')
		repairApiMock = createRepairApiMock()
		paymentMethodApiMock = createPaymentMethodApiMock()
		customerApiMock = {
			getAll: fn(),
			getById: fn(),
			getByEmail: fn(),
			getByDni: fn(),
			create: fn(),
			update: fn(),
		}
		repairApiMock.getAll.mockReturnValue(of([]))
		repairApiMock.getStatuses.mockReturnValue(of(MOCK_REPAIR_STATUSES))
		paymentMethodApiMock.getAll.mockReturnValue(of([]))
	})

	afterEach(() => useRealTimers())

	type View = Awaited<ReturnType<typeof renderAndOpen>>

	async function settle(view: { fixture: { detectChanges: () => void } }): Promise<void> {
		TestBed.tick()
		await advanceTimersByTimeAsync(50)
		view.fixture.detectChanges()
	}

	async function renderAndOpen() {
		const view = await render(RepairCreateDrawer, {
			providers: [
				provideAuthMock(),
				provideIdentityMock(),
				{ provide: RepairApi, useValue: repairApiMock },
				{ provide: CustomerApi, useValue: customerApiMock },
				{ provide: PaymentMethodApi, useValue: paymentMethodApiMock },
				{ provide: OfficeBranchStore, useValue: { currentBranch: signal(null) } },
				{ provide: Translation, useValue: repairsTranslation },
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(createMockUser({ id: 5 }))
		TestBed.tick()
		view.fixture.componentInstance.open()
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		view.fixture.detectChanges()
		return view
	}

	const type = (label: RegExp, value: string) => fireEvent.input(screen.getByLabelText(label), { target: { value } })
	const submit = () => screen.getByRole('button', { name: /^save repair|^saving/i })
	const lookup = () => fireEvent.click(screen.getByRole('button', { name: 'Search customer' }))
	const notifications = () => TestBed.inject(UIStore).notifications()

	function fillCustomer(): void {
		type(/^National ID/, '30123456')
		type(/^First name/, 'Ada')
		type(/^Last name/, 'Lovelace')
		type(/^Email/, 'ada@example.com')
		type(/^Phone/, '3425551234')
		type(/^Address/, 'Calle Falsa 123')
	}

	function fillDevice(): void {
		type(/^Brand/, 'Samsung')
		type(/^Model/, 'S21')
		type(/^Reported issue/, 'Pantalla rota')
	}

	async function submitAndSettle(view: View): Promise<void> {
		fireEvent.click(submit())
		view.fixture.detectChanges()
		TestBed.tick()
		view.fixture.detectChanges()
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
		// The drawer reports it finished closing on the dialog's transitionend.
		fireEvent.transitionEnd(screen.getByRole('dialog', { hidden: true }))
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		view.fixture.detectChanges()
	}

	it('renders the title and the three sections', async () => {
		await renderAndOpen()

		expect(screen.getByRole('heading', { name: 'New repair' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Customer' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Device' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Repair details' })).toBeInTheDocument()
	})

	it('cannot be saved while the form is incomplete', async () => {
		await renderAndOpen()

		expect(submit()).toBeDisabled()
	})

	it('can be saved once the customer and the device are complete', async () => {
		const view = await renderAndOpen()

		fillCustomer()
		fillDevice()
		await settle(view)

		expect(submit()).toBeEnabled()
	})

	it.each([
		['the DNI is too short', /^National ID/, '123456'],
		['the DNI is not numeric', /^National ID/, '12ab5678'],
		['the email is malformed', /^Email/, 'not-an-email'],
		['the telephone has letters', /^Phone/, '342abc'],
		['the brand is empty', /^Brand/, ''],
		['the reported issue is empty', /^Reported issue/, ''],
		['the price is negative', /^Price/, '-1'],
		['the warranty is longer than 24 months', /^Warranty/, '25'],
	])('cannot be saved when %s', async (_, label, value) => {
		const view = await renderAndOpen()
		fillCustomer()
		fillDevice()
		await settle(view)

		type(label, value)
		await settle(view)

		expect(submit()).toBeDisabled()
	})

	describe('customer lookup', () => {
		it('fills and locks the customer fields when the DNI is known', async () => {
			customerApiMock.getByDni.mockReturnValue(of(CUSTOMER))
			const view = await renderAndOpen()
			type(/^National ID/, '30123456')

			lookup()
			await settle(view)

			expect(customerApiMock.getByDni.calls[0][0]).toBe(30123456)
			expect(screen.getByText(/Existing customer found/)).toBeInTheDocument()
			expect(screen.getByLabelText(/^First name/)).toHaveValue('Ada')
			expect(screen.getByLabelText(/^First name/)).toBeDisabled()
			expect(screen.getByLabelText(/^Email/)).toHaveValue('ada@example.com')
		})

		it('announces that a new customer will be registered when the DNI is unknown', async () => {
			customerApiMock.getByDni.mockReturnValue(of(null))
			const view = await renderAndOpen()
			type(/^National ID/, '30123456')

			lookup()
			await settle(view)

			expect(screen.getByText(/No customer with this DNI/)).toBeInTheDocument()
			expect(screen.getByLabelText(/^First name/)).toBeEnabled()
		})

		it('looks a DNI typed with dots up by its digits', async () => {
			customerApiMock.getByDni.mockReturnValue(of(null))
			const view = await renderAndOpen()
			type(/^National ID/, '30.123.456')

			lookup()
			await settle(view)

			expect(customerApiMock.getByDni.calls[0][0]).toBe(30123456)
		})

		it('does not look an invalid DNI up', async () => {
			const view = await renderAndOpen()
			type(/^National ID/, '12')

			lookup()
			await settle(view)

			expect(customerApiMock.getByDni.calls).toHaveLength(0)
		})

		it('shows the lookup error', async () => {
			customerApiMock.getByDni.mockReturnValue(throwError(() => new Error('boom')))
			const view = await renderAndOpen()
			type(/^National ID/, '30123456')

			lookup()
			await settle(view)

			expect(screen.getByRole('alert')).toHaveTextContent('Failed to look the customer up')
		})

		it('unlocks the customer when the DNI is edited after a lookup', async () => {
			customerApiMock.getByDni.mockReturnValue(of(CUSTOMER))
			const view = await renderAndOpen()
			type(/^National ID/, '30123456')
			lookup()
			await settle(view)

			type(/^National ID/, '30123457')
			await settle(view)

			expect(screen.queryByText(/Existing customer found/)).not.toBeInTheDocument()
			expect(screen.getByLabelText(/^First name/)).toBeEnabled()
		})
	})

	describe('creating', () => {
		it('registers the new customer and the repair, then reloads the list', async () => {
			customerApiMock.create.mockReturnValue(of([CUSTOMER, true]))
			repairApiMock.create.mockReturnValue(of({ id: 41 }))
			const view = await renderAndOpen()
			fillCustomer()
			fillDevice()
			await settle(view)

			await submitAndSettle(view)

			expect(customerApiMock.create.calls).toHaveLength(1)
			const request = repairApiMock.create.calls[0][0] as {
				repairToCreate: { customer: { id: number }; issue: string }
				user: { id: number }
			}
			expect(request.repairToCreate.customer.id).toBe(7)
			expect(request.repairToCreate.issue).toBe('Pantalla rota')
			expect(request.user.id).toBe(5)
			expect(repairApiMock.getAll.calls).toHaveLength(2)
		})

		it('reuses a found customer without registering it again', async () => {
			customerApiMock.getByDni.mockReturnValue(of(CUSTOMER))
			repairApiMock.create.mockReturnValue(of({ id: 42 }))
			const view = await renderAndOpen()
			type(/^National ID/, '30123456')
			lookup()
			await settle(view)
			fillDevice()
			await settle(view)

			await submitAndSettle(view)

			expect(customerApiMock.create.calls).toHaveLength(0)
			expect(repairApiMock.create.calls).toHaveLength(1)
		})

		it('confirms the creation once the drawer has closed', async () => {
			customerApiMock.create.mockReturnValue(of([CUSTOMER, true]))
			repairApiMock.create.mockReturnValue(of({ id: 41 }))
			const view = await renderAndOpen()
			fillCustomer()
			fillDevice()
			await settle(view)

			await submitAndSettle(view)

			expect(notifications()).toHaveLength(1)
			expect(notifications()[0]).toEqual(
				expect.objectContaining({ type: 'success', message: 'Repair created successfully.' }),
			)
			expect(screen.queryByRole('heading', { name: 'New repair' })).not.toBeInTheDocument()
		})

		it('resets the form after closing', async () => {
			customerApiMock.create.mockReturnValue(of([CUSTOMER, true]))
			repairApiMock.create.mockReturnValue(of({ id: 41 }))
			const view = await renderAndOpen()
			const dni = screen.getByLabelText(/^National ID/)
			fillCustomer()
			fillDevice()
			await settle(view)

			await submitAndSettle(view)

			expect(dni).toHaveValue('')
		})

		it('shows the server error and keeps the drawer open when the repair cannot be created', async () => {
			customerApiMock.create.mockReturnValue(of([CUSTOMER, true]))
			repairApiMock.create.mockReturnValue(
				throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'Invalid repair data' } })),
			)
			const view = await renderAndOpen()
			fillCustomer()
			fillDevice()
			await settle(view)

			await submitAndSettle(view)

			expect(screen.getByRole('alert')).toHaveTextContent('Invalid repair data')
			expect(screen.getByRole('heading', { name: 'New repair' })).toBeInTheDocument()
			expect(notifications()).toHaveLength(0)
		})
	})

	describe('discarding', () => {
		it('asks for confirmation before discarding a dirty form', async () => {
			const view = await renderAndOpen()
			type(/^National ID/, '3012')
			view.fixture.detectChanges()

			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
			view.fixture.detectChanges()

			expect(screen.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeInTheDocument()
		})

		it('closes without asking when nothing was typed', async () => {
			const view = await renderAndOpen()

			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
			view.fixture.detectChanges()

			fireEvent.transitionEnd(screen.getByRole('dialog', { hidden: true }))
			await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
			expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
			expect(screen.queryByRole('heading', { name: 'New repair' })).not.toBeInTheDocument()
		})
	})
})
