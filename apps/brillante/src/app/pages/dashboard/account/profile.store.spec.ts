import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { UserRole } from '@contracts/permission/legacy-permission.constants'
import type { UserDto } from '@contracts/user/legacy-user.types'
import type { CustomerDetails } from '@domain/customer/customer.interface'
import { createMockCustomerDto } from '@domain/customer/customer.mock'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { CustomerApi } from '@providers/customer/customer.interface'
import { UserApi } from '@providers/user/user.interface'
import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { NEVER, of, throwError } from 'rxjs'
import { ProfileStore } from './profile.store'

describe('ProfileStore', () => {
	let store: InstanceType<typeof ProfileStore>
	let authStore: InstanceType<typeof AuthStore>
	let customerApiMock: Record<keyof CustomerApi, MockFn>
	let userApiMock: Record<keyof UserApi, MockFn>
	let authApiMock: Record<keyof AuthApi, MockFn>

	const customerRole = { id: UserRole.CUSTOMER, description: 'customer' }
	const details: CustomerDetails = {
		dni: 30123456,
		firstName: 'Ana',
		lastName: 'Perez',
		email: 'ana@brillante.test',
		birthDate: new Date('1990-05-20T03:00:00.000Z'),
		address: 'Calle 123',
		telephone: '3511234567',
	}

	function setupStore(): void {
		TestBed.configureTestingModule({
			providers: [
				ProfileStore,
				{ provide: AuthApi, useValue: authApiMock },
				{ provide: CustomerApi, useValue: customerApiMock },
				{ provide: UserApi, useValue: userApiMock },
			],
		})
		store = TestBed.inject(ProfileStore)
		authStore = TestBed.inject(AuthStore)
		authStore.updateCurrentUser(
			createMockUser({
				id: 11,
				userName: 'ana_perez_11',
				email: 'ana@brillante.test',
				firstName: 'Ana',
				lastName: 'Perez',
				roles: [customerRole],
				hasFinishedRegistration: false,
			}),
		)
	}

	beforeEach(() => {
		clearAllMocks()
		customerApiMock = {
			getAll: fn(),
			getById: fn(),
			getByEmail: fn(),
			getByDni: fn(),
			create: fn(),
			update: fn(),
		}
		authApiMock = {
			login: fn(),
			logout: fn(),
			refreshToken: fn(),
			getMe: fn(),
			changePassword: fn(),
			forgotPassword: fn(),
			resetPassword: fn(),
			updateProfile: fn(),
			getLegacyToken: fn(),
		}
		userApiMock = {
			getAll: fn(),
			getById: fn(),
			register: fn(),
			update: fn(),
			updateCustomerUser: fn(),
			delete: fn(),
		}
	})

	it('starts empty and idle', () => {
		setupStore()

		expect(store.customer()).toBeNull()
		expect(store.isLoading()).toBe(false)
		expect(store.isSaving()).toBe(false)
		expect(store.readError()).toEqual({ customer: null })
		expect(store.mutationError()).toEqual({ save: null })
	})

	describe('loadCustomer', () => {
		it('looks the customer up by email and maps it', () => {
			customerApiMock.getByEmail.mockReturnValue(of(createMockCustomerDto({ id: 3 })))
			setupStore()

			store.loadCustomer('ana@brillante.test')

			expect(customerApiMock.getByEmail.calls).toEqual([['ana@brillante.test']])
			expect(store.customer()?.id).toBe(3)
			expect(store.customer()?.birthDate).toBeInstanceOf(Date)
			expect(store.isLoading()).toBe(false)
		})

		it('keeps the customer null when the account has no customer record', () => {
			customerApiMock.getByEmail.mockReturnValue(of(null))
			setupStore()

			store.loadCustomer('ana@brillante.test')

			expect(store.customer()).toBeNull()
			expect(store.readError().customer).toBeNull()
		})

		it('is loading while the request is pending', () => {
			customerApiMock.getByEmail.mockReturnValue(NEVER)
			setupStore()

			store.loadCustomer('ana@brillante.test')

			expect(store.isLoading()).toBe(true)
		})

		it('records a read error when the request fails', () => {
			customerApiMock.getByEmail.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.loadCustomer('ana@brillante.test')

			expect(store.readError().customer).toBe('Failed to load customer')
			expect(store.isLoading()).toBe(false)
		})
	})

	describe('saveProfile for a customer', () => {
		const response: UserDto = {
			id: 11,
			userName: 'ana_perez_11',
			firstName: 'Ana Maria',
			lastName: 'Perez',
			avatar: null,
			email: 'ana@brillante.test',
			roles: [customerRole],
			hasFinishedRegistration: true,
		}

		beforeEach(() => {
			customerApiMock.getByEmail.mockReturnValue(of(createMockCustomerDto({ id: 3 })))
			userApiMock.updateCustomerUser.mockReturnValue(of(response))
		})

		it('saves the user together with the customer details in one request', () => {
			setupStore()
			store.loadCustomer('ana@brillante.test')

			store.saveProfile({ firstName: 'Ana Maria', lastName: 'Perez', customer: details })

			const [user, customer] = userApiMock.updateCustomerUser.calls[0]
			expect(user).toEqual({
				id: 11,
				firstName: 'Ana Maria',
				lastName: 'Perez',
				userName: 'ana maria_perez_11',
				email: 'ana@brillante.test',
			})
			expect(customer).toEqual(expect.objectContaining({ id: 3, dni: 30123456, birthDate: '1990-05-20T03:00:00.000Z' }))
		})

		it('refreshes the signed-in user with the saved details', () => {
			setupStore()
			store.loadCustomer('ana@brillante.test')

			store.saveProfile({ firstName: 'Ana Maria', lastName: 'Perez', customer: details })

			expect(authStore.currentUser()?.firstName).toBe('Ana Maria')
			expect(authStore.currentUser()?.hasFinishedRegistration).toBe(true)
			expect(authStore.currentUser()?.hasRole(UserRole.CUSTOMER)).toBe(true)
			expect(store.isSaving()).toBe(false)
			expect(store.customer()?.address).toBe('Calle 123')
		})

		it('keeps the roles the user holds when the response omits them', () => {
			userApiMock.updateCustomerUser.mockReturnValue(of({ ...response, roles: [] }))
			setupStore()

			store.saveProfile({ firstName: 'Ana', lastName: 'Perez', customer: details })

			expect(authStore.currentUser()?.hasRole(UserRole.CUSTOMER)).toBe(true)
		})

		it('is saving while the request is pending', () => {
			userApiMock.updateCustomerUser.mockReturnValue(NEVER)
			setupStore()

			store.saveProfile({ firstName: 'Ana', lastName: 'Perez', customer: details })

			expect(store.isSaving()).toBe(true)
		})

		it('records the server error message when the save fails', () => {
			userApiMock.updateCustomerUser.mockReturnValue(
				throwError(() => new HttpErrorResponse({ status: 409, error: { error: 'DNI already assigned' } })),
			)
			setupStore()

			store.saveProfile({ firstName: 'Ana', lastName: 'Perez', customer: details })

			expect(store.mutationError().save).toBe('DNI already assigned')
			expect(store.isSaving()).toBe(false)
			expect(authStore.currentUser()?.hasFinishedRegistration).toBe(false)
		})

		it('clears a previous save error when saving again', () => {
			userApiMock.updateCustomerUser.mockReturnValueOnce(throwError(() => new Error('boom')))
			setupStore()
			store.saveProfile({ firstName: 'Ana', lastName: 'Perez', customer: details })
			expect(store.mutationError().save).toBe('Failed to save profile')

			store.saveProfile({ firstName: 'Ana', lastName: 'Perez', customer: details })

			expect(store.mutationError().save).toBeNull()
		})
	})

	describe('saveProfile for a staff account', () => {
		it('updates only the name through the backend profile endpoint and refreshes the session user', () => {
			authApiMock.updateProfile.mockReturnValue(
				of({ id: 5, email: 'clerk@brillante.test', firstName: 'Carla', lastName: 'Gomez', roles: [] }),
			)
			setupStore()
			authStore.updateCurrentUser(
				createMockUser({
					id: 5,
					email: 'clerk@brillante.test',
					roles: [{ id: UserRole.COUNTER_CLERK, description: '' }],
				}),
			)

			store.saveProfile({ firstName: 'Carla', lastName: 'Gomez', customer: null })

			expect(authApiMock.updateProfile.calls).toEqual([[{ firstName: 'Carla', lastName: 'Gomez' }]])
			expect(userApiMock.updateCustomerUser.calls).toHaveLength(0)
			expect(authStore.currentUser()?.fullName).toBe('Carla Gomez')
			expect(authStore.currentUser()?.hasRole(UserRole.COUNTER_CLERK)).toBe(true)
		})

		it('records the error when the update fails', () => {
			authApiMock.updateProfile.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.saveProfile({ firstName: 'Carla', lastName: 'Gomez', customer: null })

			expect(store.mutationError().save).toBe('Failed to save profile')
		})
	})

	it('does nothing but stop saving when nobody is signed in', () => {
		authApiMock.logout.mockReturnValue(of(undefined))
		setupStore()
		authStore.logout()
		TestBed.tick()

		store.saveProfile({ firstName: 'Carla', lastName: 'Gomez', customer: null })

		expect(store.isSaving()).toBe(false)
		expect(authApiMock.updateProfile.calls).toHaveLength(0)
	})

	it('clears every error on demand', () => {
		customerApiMock.getByEmail.mockReturnValue(throwError(() => new Error('boom')))
		setupStore()
		store.loadCustomer('ana@brillante.test')

		store.clearErrors()

		expect(store.readError()).toEqual({ customer: null })
		expect(store.mutationError()).toEqual({ save: null })
	})
})
