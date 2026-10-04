import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { UserRole } from '@contracts/permission/legacy-permission.constants'
import type { AuthenticatedUserDto, UserDto } from '@contracts/user/legacy-user.types'
import type { CustomerDetails } from '@domain/customer/customer.interface'
import { createMockCustomerDto } from '@domain/customer/customer.mock'
import { createMockUser } from '@mocks/user.mock'
import { AuthSession } from '@providers/auth/auth-session'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { CustomerApi } from '@providers/customer/customer.interface'
import { provideIdentityMock } from '@providers/identity/identity.mock'
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
				provideAuthMock(),
				provideIdentityMock(),
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
		localStorage.clear()
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

		it('keeps the persisted session in sync without losing its token', () => {
			const session: AuthenticatedUserDto = { ...response, firstName: 'Old', token: 'jwt' }
			localStorage.setItem('currentUser', JSON.stringify(session))
			TestBed.resetTestingModule()
			setupStore()

			store.saveProfile({ firstName: 'Ana Maria', lastName: 'Perez', customer: details })

			const stored = TestBed.inject(AuthSession).read()
			expect(stored?.token).toBe('jwt')
			expect(stored?.firstName).toBe('Ana Maria')
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
		it('updates only the name through the user endpoint and refreshes the session user', () => {
			userApiMock.update.mockReturnValue(of([1]))
			setupStore()
			authStore.updateCurrentUser(
				createMockUser({
					id: 5,
					email: 'clerk@brillante.test',
					roles: [{ id: UserRole.COUNTER_CLERK, description: '' }],
				}),
			)

			store.saveProfile({ firstName: 'Carla', lastName: 'Gomez', customer: null })

			expect(userApiMock.update.calls).toEqual([[{ id: 5, firstName: 'Carla', lastName: 'Gomez' }]])
			expect(userApiMock.updateCustomerUser.calls).toHaveLength(0)
			expect(authStore.currentUser()?.fullName).toBe('Carla Gomez')
			expect(authStore.currentUser()?.hasRole(UserRole.COUNTER_CLERK)).toBe(true)
		})

		it('records the error when the update fails', () => {
			userApiMock.update.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.saveProfile({ firstName: 'Carla', lastName: 'Gomez', customer: null })

			expect(store.mutationError().save).toBe('Failed to save profile')
		})
	})

	it('does nothing but stop saving when nobody is signed in', () => {
		setupStore()
		authStore.logout()
		TestBed.tick()

		store.saveProfile({ firstName: 'Carla', lastName: 'Gomez', customer: null })

		expect(store.isSaving()).toBe(false)
		expect(userApiMock.update.calls).toHaveLength(0)
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
