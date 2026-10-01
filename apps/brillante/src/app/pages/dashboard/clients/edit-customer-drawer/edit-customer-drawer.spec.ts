import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { customerTranslation } from '@domain/customer/customer-translation.mock'
import type { ICustomer } from '@domain/customer/customer.interface'
import { createMockCustomer } from '@domain/customer/customer.mock'
import { CustomerApi } from '@providers/customer/customer.interface'
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
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen } from '@testing-library/angular'
import { of, throwError } from 'rxjs'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../clients.constants'
import { EditCustomerDrawer } from './edit-customer-drawer'

describe('EditCustomerDrawer', () => {
	let apiMock: Record<keyof CustomerApi, MockFn>
	const customer = createMockCustomer({ id: 5, dni: 27111222, firstName: 'Luis', lastName: 'Gomez' })

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		apiMock = {
			getAll: fn(),
			getById: fn(),
			getByEmail: fn(),
			getByDni: fn(),
			create: fn(),
			update: fn(),
		}
		apiMock.getAll.mockReturnValue(of({ count: 0, rows: [] }))
	})

	afterEach(() => {
		useRealTimers()
	})

	async function renderAndOpen(target: ICustomer = customer) {
		const { fixture } = await render(EditCustomerDrawer, {
			providers: [
				{ provide: CustomerApi, useValue: apiMock },
				{ provide: Translation, useValue: customerTranslation },
			],
		})
		TestBed.tick()
		fixture.componentInstance.open(target)
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		fixture.detectChanges()
		return { fixture }
	}

	function type(label: RegExp, value: string): void {
		fireEvent.input(screen.getByLabelText(label), { target: { value } })
	}

	async function saveAndSettle(fixture: { detectChanges(): void }): Promise<void> {
		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		fixture.detectChanges()
		TestBed.tick()
		fixture.detectChanges()
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
		// The drawer reports it finished closing on the dialog's transitionend.
		fireEvent.transitionEnd(screen.getByRole('dialog', { hidden: true }))
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		fixture.detectChanges()
	}

	it('prefills every field from the customer', async () => {
		await renderAndOpen()

		expect(screen.getByRole('heading', { name: 'Edit client' })).toBeInTheDocument()
		expect(screen.getByLabelText(/dni/i)).toHaveValue('27111222')
		expect(screen.getByLabelText(/first name/i)).toHaveValue('Luis')
		expect(screen.getByLabelText(/last name/i)).toHaveValue('Gomez')
		expect(screen.getByLabelText(/email/i)).toHaveValue('ana@brillante.test')
		expect(screen.getByLabelText(/birth date/i)).toHaveValue('1990-05-20')
		expect(screen.getByLabelText(/telephone/i)).toHaveValue('3511234567')
		expect(screen.getByLabelText(/address/i)).toHaveValue('Calle 123')
	})

	it('leaves the birth date empty for a customer that has none', async () => {
		await renderAndOpen(createMockCustomer({ id: 6, birthDate: null }))

		expect(screen.getByLabelText(/birth date/i)).toHaveValue('')
	})

	it('keeps save disabled until something changes', async () => {
		const { fixture } = await renderAndOpen()

		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

		type(/address/i, 'Calle 456')
		fixture.detectChanges()

		expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
	})

	it('does not allow saving an invalid change', async () => {
		const { fixture } = await renderAndOpen()

		type(/email/i, 'not-an-email')
		fixture.detectChanges()

		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
		expect(apiMock.update.calls).toHaveLength(0)
	})

	it('sends the changed customer including its id and confirms once closed', async () => {
		apiMock.update.mockReturnValue(of([1]))
		const { fixture } = await renderAndOpen()
		type(/address/i, 'Calle 456')
		fixture.detectChanges()

		await saveAndSettle(fixture)

		expect(apiMock.update.calls[0][0]).toEqual(
			expect.objectContaining({ id: 5, dni: 27111222, address: 'Calle 456', firstName: 'Luis' }),
		)
		const notifications = TestBed.inject(UIStore).notifications()
		expect(notifications).toHaveLength(1)
		expect(notifications[0]).toEqual(
			expect.objectContaining({ type: 'success', message: 'Client updated successfully.' }),
		)
	})

	it('shows the server error and keeps the drawer open when saving fails', async () => {
		apiMock.update.mockReturnValue(
			throwError(() => new HttpErrorResponse({ status: 500, error: { error: 'Could not update' } })),
		)
		const { fixture } = await renderAndOpen()
		type(/address/i, 'Calle 456')
		fixture.detectChanges()

		await saveAndSettle(fixture)

		expect(screen.getByRole('alert')).toHaveTextContent('Could not update')
		expect(screen.getByRole('heading', { name: 'Edit client' })).toBeInTheDocument()
		expect(TestBed.inject(UIStore).notifications()).toHaveLength(0)
	})

	it('drops unsaved edits when it is reopened for another customer', async () => {
		const { fixture } = await renderAndOpen()
		type(/address/i, 'Calle 456')
		fixture.detectChanges()

		fixture.componentInstance.open(createMockCustomer({ id: 8, firstName: 'Marta', address: 'Otra 1' }))
		fixture.detectChanges()

		expect(screen.getByLabelText(/first name/i)).toHaveValue('Marta')
		expect(screen.getByLabelText(/address/i)).toHaveValue('Otra 1')
		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
	})
})
