import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { UserRole } from '@contracts/permission/legacy-permission.constants'
import type { AuthenticatedUserDto, UserDto } from '@contracts/user/legacy-user.types'
import { customerTranslation } from '@domain/customer/customer-translation.mock'
import { createMockCustomerDto } from '@domain/customer/customer.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { CustomerApi } from '@providers/customer/customer.interface'
import { provideIdentityMock } from '@providers/identity/identity.mock'
import { UserApi } from '@providers/user/user.interface'
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
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import ProfilePage from './profile-page'

describe('ProfilePage', () => {
	let customerApiMock: Record<keyof CustomerApi, MockFn>
	let userApiMock: Record<keyof UserApi, MockFn>

	const customerUser: AuthenticatedUserDto = {
		id: 11,
		userName: 'ana_perez_11',
		firstName: 'Ana',
		lastName: 'Perez',
		avatar: null,
		email: 'ana@brillante.test',
		roles: [{ id: UserRole.CUSTOMER, description: 'customer' }],
		hasFinishedRegistration: true,
		token: 'jwt',
	}
	const staffUser: AuthenticatedUserDto = {
		...customerUser,
		id: 5,
		email: 'clerk@brillante.test',
		firstName: 'Carla',
		lastName: 'Gomez',
		roles: [{ id: UserRole.COUNTER_CLERK, description: 'counter clerk' }],
	}

	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()
		useFakeTimers()
		spyOn(console, 'error')
		customerApiMock = {
			getAll: fn(),
			getById: fn(),
			getByEmail: fn(),
			getByDni: fn(),
			create: fn(),
			update: fn(),
		}
		userApiMock = {
			getAll: fn(),
			getById: fn(),
			register: fn(),
			update: fn(),
			updateCustomerUser: fn(),
			delete: fn(),
		}
		customerApiMock.getByEmail.mockReturnValue(of(createMockCustomerDto({ id: 3 })))
	})

	afterEach(() => {
		useRealTimers()
		localStorage.clear()
	})

	async function renderPage(session: AuthenticatedUserDto) {
		localStorage.setItem('currentUser', JSON.stringify(session))
		const view = await render(ProfilePage, {
			providers: [
				provideAuthMock(),
				provideIdentityMock(),
				{ provide: CustomerApi, useValue: customerApiMock },
				{ provide: UserApi, useValue: userApiMock },
				{ provide: Translation, useValue: customerTranslation },
			],
		})
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	function type(label: RegExp, value: string): void {
		fireEvent.input(screen.getByLabelText(label), { target: { value } })
	}

	describe('customer account', () => {
		it('looks the customer record up by the account email', async () => {
			await renderPage(customerUser)

			expect(customerApiMock.getByEmail.calls).toEqual([['ana@brillante.test']])
		})

		it('prefills the registration details from the account and the customer record', async () => {
			await renderPage(customerUser)

			expect(screen.getByRole('heading', { name: 'My profile' })).toBeInTheDocument()
			expect(screen.getByRole('heading', { name: 'Customer registration' })).toBeInTheDocument()
			expect(screen.getByLabelText(/first name/i)).toHaveValue('Ana')
			expect(screen.getByLabelText(/dni/i)).toHaveValue('30123456')
			expect(screen.getByLabelText(/birth date/i)).toHaveValue('1990-05-20')
			expect(screen.getByLabelText(/telephone/i)).toHaveValue('3511234567')
			expect(screen.getByLabelText(/address/i)).toHaveValue('Calle 123')
		})

		it('shows the email as read-only', async () => {
			await renderPage(customerUser)

			expect(screen.getByLabelText(/email/i)).toHaveValue('ana@brillante.test')
			expect(screen.getByLabelText(/email/i)).toHaveAttribute('readonly')
			expect(screen.getByText('Your email cannot be changed')).toBeInTheDocument()
		})

		it('invites customers who have not finished registering to complete their profile', async () => {
			await renderPage({ ...customerUser, hasFinishedRegistration: false })

			expect(screen.getByTestId('profile-incomplete')).toHaveTextContent('Finish your registration')
		})

		it('shows no invitation once the registration is finished', async () => {
			await renderPage(customerUser)

			expect(screen.queryByTestId('profile-incomplete')).not.toBeInTheDocument()
		})

		it('starts with a disabled save button and enables it after a valid change', async () => {
			const view = await renderPage(customerUser)

			expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

			type(/address/i, 'Calle 456')
			view.fixture.detectChanges()

			expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
		})

		it.each([
			['the DNI is not numeric', /dni/i, 'abc'],
			['the telephone has letters', /telephone/i, '35x'],
			['the birth date is in the future', /birth date/i, '2999-01-01'],
			['the address is cleared', /address/i, ''],
			['the first name is cleared', /first name/i, ''],
		])('does not allow saving when %s', async (_, label, value) => {
			const view = await renderPage(customerUser)

			type(label, value)
			view.fixture.detectChanges()

			expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
			expect(userApiMock.updateCustomerUser.calls).toHaveLength(0)
		})

		it('saves the user and the customer together, then refreshes the signed-in user', async () => {
			const saved: UserDto = { ...customerUser, firstName: 'Ana Maria', hasFinishedRegistration: true }
			userApiMock.updateCustomerUser.mockReturnValue(of(saved))
			const view = await renderPage({ ...customerUser, hasFinishedRegistration: false })
			type(/first name/i, 'Ana Maria')
			type(/address/i, 'Calle 456')
			view.fixture.detectChanges()

			fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
			TestBed.tick()
			view.fixture.detectChanges()

			const [user, customer] = userApiMock.updateCustomerUser.calls[0]
			expect(user).toEqual(expect.objectContaining({ id: 11, firstName: 'Ana Maria', email: 'ana@brillante.test' }))
			expect(customer).toEqual(expect.objectContaining({ id: 3, dni: 30123456, address: 'Calle 456' }))
			const currentUser = TestBed.inject(AuthStore).currentUser()
			expect(currentUser?.firstName).toBe('Ana Maria')
			expect(currentUser?.hasFinishedRegistration).toBe(true)
		})

		it('confirms the save with a notification and disables save again', async () => {
			userApiMock.updateCustomerUser.mockReturnValue(of({ ...customerUser }))
			const view = await renderPage(customerUser)
			type(/address/i, 'Calle 456')
			view.fixture.detectChanges()

			fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
			TestBed.tick()
			view.fixture.detectChanges()

			const notifications = TestBed.inject(UIStore).notifications()
			expect(notifications).toHaveLength(1)
			expect(notifications[0]).toEqual(
				expect.objectContaining({ type: 'success', message: 'Your details were updated successfully.' }),
			)
			expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
		})

		it('shows the server error and keeps the form editable when saving fails', async () => {
			userApiMock.updateCustomerUser.mockReturnValue(
				throwError(() => new HttpErrorResponse({ status: 409, error: { error: 'DNI already assigned' } })),
			)
			const view = await renderPage(customerUser)
			type(/dni/i, '27111222')
			view.fixture.detectChanges()

			fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
			TestBed.tick()
			view.fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('DNI already assigned')
			expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
			expect(TestBed.inject(AuthStore).currentUser()?.firstName).toBe('Ana')
		})

		it('shows a loading state while the customer record loads', async () => {
			customerApiMock.getByEmail.mockReturnValue(NEVER)
			localStorage.setItem('currentUser', JSON.stringify(customerUser))

			await render(ProfilePage, {
				providers: [
					provideAuthMock(),
					provideIdentityMock(),
					{ provide: CustomerApi, useValue: customerApiMock },
					{ provide: UserApi, useValue: userApiMock },
					{ provide: Translation, useValue: customerTranslation },
				],
			})
			TestBed.tick()

			expect(screen.getByRole('status')).toHaveTextContent('Loading...')
			expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument()
		})

		it('shows an error when the customer record cannot be loaded', async () => {
			customerApiMock.getByEmail.mockReturnValue(throwError(() => new Error('boom')))

			await renderPage(customerUser)

			expect(screen.getByRole('alert')).toHaveTextContent('Failed to load customer')
		})
	})

	describe('staff account', () => {
		it('shows only the name and email and never loads a customer record', async () => {
			await renderPage(staffUser)

			expect(screen.getByRole('heading', { name: 'Personal details' })).toBeInTheDocument()
			expect(screen.getByLabelText(/first name/i)).toHaveValue('Carla')
			expect(screen.getByLabelText(/email/i)).toHaveValue('clerk@brillante.test')
			expect(screen.queryByLabelText(/dni/i)).not.toBeInTheDocument()
			expect(screen.queryByLabelText(/address/i)).not.toBeInTheDocument()
			expect(customerApiMock.getByEmail.calls).toHaveLength(0)
		})

		it('does not invite staff to finish a customer registration', async () => {
			await renderPage({ ...staffUser, hasFinishedRegistration: false })

			expect(screen.queryByTestId('profile-incomplete')).not.toBeInTheDocument()
		})

		it('saves only the name through the user endpoint', async () => {
			userApiMock.update.mockReturnValue(of([1]))
			const view = await renderPage(staffUser)
			type(/last name/i, 'Gomez Diaz')
			view.fixture.detectChanges()

			fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
			TestBed.tick()
			view.fixture.detectChanges()

			expect(userApiMock.update.calls).toEqual([[{ id: 5, firstName: 'Carla', lastName: 'Gomez Diaz' }]])
			expect(userApiMock.updateCustomerUser.calls).toHaveLength(0)
			expect(TestBed.inject(AuthStore).currentUser()?.fullName).toBe('Carla Gomez Diaz')
		})

		it('requires a name to save', async () => {
			const view = await renderPage(staffUser)

			type(/first name/i, '')
			view.fixture.detectChanges()

			expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
		})
	})
})
