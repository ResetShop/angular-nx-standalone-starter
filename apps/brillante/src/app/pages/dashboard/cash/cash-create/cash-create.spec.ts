import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import type { CashTransactionRequest } from '@contracts/cash/cash-transaction.types'
import { CashConceptApi } from '@providers/cash-concept/cash-concept.interface'
import { CashApi } from '@providers/cash/cash.interface'
import {
	createMockCashTransactionDto,
	createMockConceptDto,
	createMockPaymentMethodDto,
} from '@providers/cash/cash.mock'
import { provideCashTestEnvironment, seedSession } from '@providers/cash/cash.testing'
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
import { CashStore } from '@store/cash/cash.store'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import CashCreate from './cash-create'

@Component({ selector: 'app-blank', standalone: true, template: '' })
class Blank {}

describe('CashCreate', () => {
	let cashApiMock: Record<keyof CashApi, MockFn>
	let conceptApiMock: Record<keyof CashConceptApi, MockFn>
	let paymentMethodApiMock: Record<keyof PaymentMethodApi, MockFn>

	const parent = createMockConceptDto({ id: 1, description: 'Ventas', parent: null })
	const tree = [{ ...parent, children: [createMockConceptDto({ id: 11, description: 'Accesorios', parent })] }]

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

	async function renderPage() {
		const view = await render(CashCreate, {
			providers: [
				provideRouter([{ path: 'dashboard/cash', component: Blank }]),
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

	function fillValidForm(): void {
		fireEvent.input(screen.getByLabelText('Amount'), { target: { value: '1500' } })
		fireEvent.input(screen.getByLabelText(/^Note/), { target: { value: 'Venta de mostrador' } })
		TestBed.tick()
	}

	function save(): void {
		fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }))
		TestBed.tick()
	}

	it('should show a loading status while the catalogues load', async () => {
		conceptApiMock.getAll.mockReturnValue(NEVER)

		await render(CashCreate, {
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

		expect(screen.getByRole('status')).toHaveTextContent('Loading...')
	})

	it('should show the error when the concepts cannot be loaded', async () => {
		conceptApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))

		await renderPage()

		expect(screen.getByRole('alert')).toHaveTextContent('The transaction concepts could not be loaded.')
	})

	it('should show the error when the payment methods cannot be loaded', async () => {
		paymentMethodApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))

		await renderPage()

		expect(screen.getByRole('alert')).toHaveTextContent('The payment methods could not be loaded.')
	})

	it('should render the create form with the signed-in user', async () => {
		await renderPage()

		expect(screen.getByRole('heading', { name: 'Create transaction' })).toBeInTheDocument()
		expect(screen.getByLabelText('Amount')).toBeInTheDocument()
		expect(screen.getByText('clerk')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Back to the cash register' })).toHaveAttribute('href', '/dashboard/cash')
	})

	it('should create the transaction with the filled values', async () => {
		cashApiMock.create.mockReturnValue(of([createMockCashTransactionDto()]))
		await renderPage()

		fillValidForm()
		save()

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

	it('should confirm with a toast and go back to the cash register after creating', async () => {
		cashApiMock.create.mockReturnValue(of([createMockCashTransactionDto()]))
		await renderPage()

		fillValidForm()
		save()
		await advanceTimersByTimeAsync(0)

		expect(TestBed.inject(UIStore).notifications()).toEqual([
			expect.objectContaining({ type: 'success', message: 'Transaction created successfully.' }),
		])
		expect(TestBed.inject(Router).url).toBe('/dashboard/cash')
	})

	it('should keep the form and show the failure inline when creating fails', async () => {
		cashApiMock.create.mockReturnValue(throwError(() => new Error('boom')))
		await renderPage()

		fillValidForm()
		save()

		expect(screen.getByRole('alert')).toHaveTextContent('The transaction could not be created.')
		expect(TestBed.inject(UIStore).notifications()).toEqual([])
		expect(TestBed.inject(Router).url).toBe('/')
	})

	it('should go back to the cash register when cancelling', async () => {
		await renderPage()

		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		await advanceTimersByTimeAsync(0)

		expect(TestBed.inject(Router).url).toBe('/dashboard/cash')
		expect(cashApiMock.create.calls).toHaveLength(0)
	})
})
