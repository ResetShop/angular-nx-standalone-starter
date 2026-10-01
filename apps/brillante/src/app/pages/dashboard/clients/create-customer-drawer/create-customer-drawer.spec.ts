import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { customerTranslation } from '@domain/customer/customer-translation.mock'
import { createMockCustomerDto } from '@domain/customer/customer.mock'
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
import { CreateCustomerDrawer } from './create-customer-drawer'

describe('CreateCustomerDrawer', () => {
	let apiMock: Record<keyof CustomerApi, MockFn>

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

	async function renderAndOpen() {
		const { fixture } = await render(CreateCustomerDrawer, {
			providers: [
				{ provide: CustomerApi, useValue: apiMock },
				{ provide: Translation, useValue: customerTranslation },
			],
		})
		TestBed.tick()
		fixture.componentInstance.open()
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		fixture.detectChanges()
		return { fixture }
	}

	function type(label: RegExp, value: string): void {
		fireEvent.input(screen.getByLabelText(label), { target: { value } })
	}

	function fillValidForm(fixture: { detectChanges(): void }): void {
		type(/dni/i, '30123456')
		type(/first name/i, 'Ana')
		type(/last name/i, 'Perez')
		type(/email/i, 'ana@brillante.test')
		type(/birth date/i, '1990-05-20')
		type(/telephone/i, '3511234567')
		type(/address/i, 'Calle 123')
		fixture.detectChanges()
	}

	async function submitAndSettle(fixture: { detectChanges(): void }): Promise<void> {
		fireEvent.click(screen.getByRole('button', { name: 'Create' }))
		fixture.detectChanges()
		TestBed.tick()
		fixture.detectChanges()
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
		// The drawer reports it finished closing on the dialog's transitionend.
		fireEvent.transitionEnd(screen.getByRole('dialog', { hidden: true }))
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		fixture.detectChanges()
	}

	it('renders the title and every customer field', async () => {
		await renderAndOpen()

		expect(screen.getByRole('heading', { name: 'New client' })).toBeInTheDocument()
		expect(screen.getByLabelText(/dni/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
	})

	it('keeps the create button disabled until the form is valid', async () => {
		const { fixture } = await renderAndOpen()

		expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()

		fillValidForm(fixture)

		expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled()
	})

	it.each([
		['the DNI is not numeric', /dni/i, '12ab5678'],
		['the DNI is too short', /dni/i, '123456'],
		['the DNI is too long', /dni/i, '1234567890'],
		['the email is malformed', /email/i, 'not-an-email'],
		['the telephone has letters', /telephone/i, '351abc'],
		['the first name is empty', /first name/i, ''],
		['the address is empty', /address/i, ''],
		['the birth date is empty', /birth date/i, ''],
		['the birth date is in the future', /birth date/i, '2999-01-01'],
	])('does not allow submitting when %s', async (_, label, value) => {
		const { fixture } = await renderAndOpen()
		fillValidForm(fixture)

		type(label, value)
		fixture.detectChanges()

		expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
		expect(apiMock.create.calls).toHaveLength(0)
	})

	it('explains a future birth date', async () => {
		const { fixture } = await renderAndOpen()
		fillValidForm(fixture)

		type(/birth date/i, '2999-01-01')
		fireEvent.blur(screen.getByLabelText(/birth date/i))
		fixture.detectChanges()

		expect(screen.getByText('The birth date cannot be in the future')).toBeInTheDocument()
	})

	it('sends the typed details in the wire format', async () => {
		apiMock.create.mockReturnValue(of([createMockCustomerDto({ id: 9 }), true]))
		const { fixture } = await renderAndOpen()
		fillValidForm(fixture)

		await submitAndSettle(fixture)

		const request = apiMock.create.calls[0][0] as Record<string, unknown>
		expect(request).toEqual(
			expect.objectContaining({
				dni: 30123456,
				firstName: 'Ana',
				lastName: 'Perez',
				email: 'ana@brillante.test',
				telephone: '3511234567',
				address: 'Calle 123',
			}),
		)
		expect(typeof request['birthDate']).toBe('string')
		expect(new Date(request['birthDate'] as string).getFullYear()).toBe(1990)
	})

	it('confirms a created customer once the drawer has closed', async () => {
		apiMock.create.mockReturnValue(of([createMockCustomerDto({ id: 9 }), true]))
		const { fixture } = await renderAndOpen()
		fillValidForm(fixture)

		await submitAndSettle(fixture)

		const notifications = TestBed.inject(UIStore).notifications()
		expect(notifications).toHaveLength(1)
		expect(notifications[0]).toEqual(
			expect.objectContaining({ type: 'success', message: 'Client created successfully.' }),
		)
	})

	it('warns instead of confirming when the DNI already belonged to a customer', async () => {
		apiMock.create.mockReturnValue(of([createMockCustomerDto({ id: 2 }), false]))
		const { fixture } = await renderAndOpen()
		fillValidForm(fixture)

		await submitAndSettle(fixture)

		const notifications = TestBed.inject(UIStore).notifications()
		expect(notifications).toHaveLength(1)
		expect(notifications[0]).toEqual(
			expect.objectContaining({
				type: 'warning',
				message: 'A client with that DNI was already registered, so no new client was created.',
			}),
		)
	})

	it('resets the form after closing', async () => {
		apiMock.create.mockReturnValue(of([createMockCustomerDto({ id: 9 }), true]))
		const { fixture } = await renderAndOpen()
		const dni = screen.getByLabelText(/dni/i)
		fillValidForm(fixture)

		await submitAndSettle(fixture)

		expect(dni).toHaveValue('')
	})

	it('shows the server error and keeps the drawer open when creation fails', async () => {
		apiMock.create.mockReturnValue(
			throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'Invalid customer data' } })),
		)
		const { fixture } = await renderAndOpen()
		fillValidForm(fixture)

		await submitAndSettle(fixture)

		expect(screen.getByRole('alert')).toHaveTextContent('Invalid customer data')
		expect(screen.getByRole('heading', { name: 'New client' })).toBeInTheDocument()
		expect(TestBed.inject(UIStore).notifications()).toHaveLength(0)
	})

	it('asks for confirmation before discarding a dirty form', async () => {
		const { fixture } = await renderAndOpen()
		type(/first name/i, 'Ana')
		fixture.detectChanges()

		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		fixture.detectChanges()

		expect(screen.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeInTheDocument()
	})
})
