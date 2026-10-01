import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter, Router } from '@angular/router'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { CustomerApi } from '@providers/customer/customer.interface'
import { provideIdentityMock } from '@providers/identity/identity.mock'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import { RepairApi } from '@providers/repair/repair.interface'
import { MOCK_REPAIR_STATUSES } from '@providers/repair/repair.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
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
import { fireEvent, render, screen } from '@testing-library/angular'
import { of, throwError } from 'rxjs'
import { createPaymentMethodApiMock, createRepairApiMock } from '../testing/repair-api.mock'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import RepairCreate from './repair-create'

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

describe('RepairCreate', () => {
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

	async function settle(view: { fixture: { detectChanges: () => void } }): Promise<void> {
		TestBed.tick()
		await advanceTimersByTimeAsync(50)
		view.fixture.detectChanges()
	}

	async function renderCreate() {
		const view = await render(RepairCreate, {
			providers: [
				provideRouter([]),
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
		await settle(view)
		return view
	}

	const type = (label: RegExp, value: string) => fireEvent.input(screen.getByLabelText(label), { target: { value } })
	const submit = () => screen.getByRole('button', { name: 'Save repair' })

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

	it('renders the three sections', async () => {
		await renderCreate()

		expect(screen.getByRole('heading', { name: 'New repair', level: 1 })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Customer' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Device' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Repair details' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /Back to repairs/ })).toHaveAttribute('href', '/dashboard/repairs')
	})

	it('cannot be saved while the form is incomplete', async () => {
		await renderCreate()

		expect(submit()).toBeDisabled()
	})

	it('fills and locks the customer fields when the DNI is known', async () => {
		customerApiMock.getByDni.mockReturnValue(of(CUSTOMER))
		const view = await renderCreate()
		type(/^National ID/, '30123456')

		fireEvent.click(screen.getByRole('button', { name: 'Search customer' }))
		await settle(view)

		expect(customerApiMock.getByDni.calls[0][0]).toBe(30123456)
		expect(screen.getByText(/Existing customer found/)).toBeInTheDocument()
		expect(screen.getByLabelText(/^First name/)).toHaveValue('Ada')
		expect(screen.getByLabelText(/^First name/)).toBeDisabled()
		expect(screen.getByLabelText(/^Email/)).toHaveValue('ada@example.com')
	})

	it('announces that a new customer will be registered when the DNI is unknown', async () => {
		customerApiMock.getByDni.mockReturnValue(of(null))
		const view = await renderCreate()
		type(/^National ID/, '30123456')

		fireEvent.click(screen.getByRole('button', { name: 'Search customer' }))
		await settle(view)

		expect(screen.getByText(/No customer with this DNI/)).toBeInTheDocument()
		expect(screen.getByLabelText(/^First name/)).toBeEnabled()
	})

	it('does not look an invalid DNI up', async () => {
		const view = await renderCreate()
		type(/^National ID/, '12')

		fireEvent.click(screen.getByRole('button', { name: 'Search customer' }))
		await settle(view)

		expect(customerApiMock.getByDni.calls).toHaveLength(0)
	})

	it('shows the lookup error', async () => {
		customerApiMock.getByDni.mockReturnValue(throwError(() => new Error('boom')))
		const view = await renderCreate()
		type(/^National ID/, '30123456')

		fireEvent.click(screen.getByRole('button', { name: 'Search customer' }))
		await settle(view)

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to look the customer up')
	})

	it('unlocks the customer when the DNI is edited after a lookup', async () => {
		customerApiMock.getByDni.mockReturnValue(of(CUSTOMER))
		const view = await renderCreate()
		type(/^National ID/, '30123456')
		fireEvent.click(screen.getByRole('button', { name: 'Search customer' }))
		await settle(view)

		type(/^National ID/, '30123457')
		await settle(view)

		expect(screen.queryByText(/Existing customer found/)).not.toBeInTheDocument()
		expect(screen.getByLabelText(/^First name/)).toBeEnabled()
	})

	it('registers the new customer and the repair, then opens the repair', async () => {
		customerApiMock.create.mockReturnValue(of([CUSTOMER, true]))
		repairApiMock.create.mockReturnValue(of({ id: 41 }))
		const view = await renderCreate()
		const navigate = spyOn(TestBed.inject(Router), 'navigate')
		navigate.mockReturnValue(Promise.resolve(true))
		fillCustomer()
		fillDevice()
		await settle(view)

		fireEvent.click(submit())
		await settle(view)

		expect(customerApiMock.create.calls).toHaveLength(1)
		const request = repairApiMock.create.calls[0][0] as { repairToCreate: { customer: { id: number }; issue: string } }
		expect(request.repairToCreate.customer.id).toBe(7)
		expect(request.repairToCreate.issue).toBe('Pantalla rota')
		expect(navigate.calls[0][0]).toEqual(['/dashboard/repairs', 41])
	})

	it('reuses a found customer without registering it again', async () => {
		customerApiMock.getByDni.mockReturnValue(of(CUSTOMER))
		repairApiMock.create.mockReturnValue(of({ id: 42 }))
		const view = await renderCreate()
		spyOn(TestBed.inject(Router), 'navigate').mockReturnValue(Promise.resolve(true))
		type(/^National ID/, '30123456')
		fireEvent.click(screen.getByRole('button', { name: 'Search customer' }))
		await settle(view)
		fillDevice()
		await settle(view)

		fireEvent.click(submit())
		await settle(view)

		expect(customerApiMock.create.calls).toHaveLength(0)
		expect(repairApiMock.create.calls).toHaveLength(1)
	})

	it('shows the error and stays on the form when the repair cannot be created', async () => {
		customerApiMock.create.mockReturnValue(of([CUSTOMER, true]))
		repairApiMock.create.mockReturnValue(throwError(() => new Error('boom')))
		const view = await renderCreate()
		const navigate = spyOn(TestBed.inject(Router), 'navigate')
		fillCustomer()
		fillDevice()
		await settle(view)

		fireEvent.click(submit())
		await settle(view)

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to create the repair')
		expect(navigate.calls).toHaveLength(0)
	})
})
