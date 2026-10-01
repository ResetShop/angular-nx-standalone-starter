import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import type { CustomerDto } from '@contracts/client/client.types'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import type { RepairIntake } from '@domain/repair/repair.model'
import type { IUser } from '@domain/user/user.interface'
import { createMockUser } from '@mocks/user.mock'
import { CustomerApi } from '@providers/customer/customer.interface'
import { RepairApi } from '@providers/repair/repair.interface'
import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { NEVER, of, throwError } from 'rxjs'
import { RepairIntakeStore } from './repair-intake.store'
import { RepairStore } from './repair.store'

const CUSTOMER_DTO: CustomerDto = {
	id: 7,
	dni: 30123456,
	firstName: 'Ada',
	lastName: 'Lovelace',
	email: 'ada@example.com',
	birthDate: '1990-05-01T03:00:00.000Z',
	address: 'Calle Falsa 123',
	telephone: '3425551234',
}

function createIntake(customerId: number | null): RepairIntake {
	return {
		customer: {
			id: customerId,
			dni: 30123456,
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			address: 'Calle Falsa 123',
			telephone: '3425551234',
			birthDate: null,
		},
		device: { turnedOn: true, typeId: 0, manufacturer: 'Samsung', model: 'S21', deviceId: '3569871' },
		issue: 'Pantalla rota',
		note: '',
		status: { id: RepairStatusId.ENTERED, description: 'Ingresado' },
		paymentInAdvance: 0,
		price: 0,
		cost: 0,
		warrantyTerm: 3,
	}
}

describe('RepairIntakeStore', () => {
	let store: InstanceType<typeof RepairIntakeStore>
	let customerApiMock: Record<keyof CustomerApi, MockFn>
	let repairApiMock: Record<keyof RepairApi, MockFn>
	let repairStoreMock: { reload: MockFn }
	let currentUser: ReturnType<typeof signal<IUser | null>>

	function setupStore(): void {
		TestBed.configureTestingModule({
			providers: [
				RepairIntakeStore,
				{ provide: CustomerApi, useValue: customerApiMock },
				{ provide: RepairApi, useValue: repairApiMock },
				{ provide: RepairStore, useValue: repairStoreMock },
				{ provide: AuthStore, useValue: { currentUser } },
			],
		})
		store = TestBed.inject(RepairIntakeStore)
	}

	beforeEach(() => {
		clearAllMocks()
		currentUser = signal<IUser | null>(createMockUser({ id: 5 }))
		customerApiMock = {
			getAll: fn(),
			getById: fn(),
			getByEmail: fn(),
			getByDni: fn(),
			create: fn(),
			update: fn(),
		}
		repairApiMock = {
			getAll: fn(),
			getAllByDate: fn(),
			getById: fn(),
			getHistory: fn(),
			getByClientId: fn(),
			create: fn(),
			updateDeviceInfo: fn(),
			updateTrackingInfo: fn(),
			delete: fn(),
			getStatuses: fn(),
		}
		repairStoreMock = { reload: fn() }
	})

	describe('lookupCustomer', () => {
		it('starts idle', () => {
			setupStore()

			expect(store.lookupStatus()).toBe('idle')
			expect(store.customer()).toBeNull()
			expect(store.customerExists()).toBe(false)
		})

		it('reports the lookup as in flight', () => {
			customerApiMock.getByDni.mockReturnValue(NEVER)
			setupStore()

			store.lookupCustomer(30123456)

			expect(store.isLookingUp()).toBe(true)
		})

		it('stores the found customer', () => {
			customerApiMock.getByDni.mockReturnValue(of(CUSTOMER_DTO))
			setupStore()

			store.lookupCustomer(30123456)

			expect(customerApiMock.getByDni.calls[0][0]).toBe(30123456)
			expect(store.lookupStatus()).toBe('found')
			expect(store.customerExists()).toBe(true)
			expect(store.customer()?.fullName).toBe('Ada Lovelace')
			expect(store.customer()?.id).toBe(7)
		})

		it('marks the DNI as unknown when the API answers null', () => {
			customerApiMock.getByDni.mockReturnValue(of(null))
			setupStore()

			store.lookupCustomer(30123456)

			expect(store.lookupStatus()).toBe('not-found')
			expect(store.customer()).toBeNull()
		})

		it('records a lookup error and goes back to idle on failure', () => {
			customerApiMock.getByDni.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.lookupCustomer(30123456)

			expect(store.lookupStatus()).toBe('idle')
			expect(store.readError().lookup).toBe('Failed to look the customer up')
		})

		it('forgets the customer on demand', () => {
			customerApiMock.getByDni.mockReturnValue(of(CUSTOMER_DTO))
			setupStore()
			store.lookupCustomer(30123456)

			store.clearCustomer()

			expect(store.lookupStatus()).toBe('idle')
			expect(store.customer()).toBeNull()
		})
	})

	describe('createRepair', () => {
		it('creates the repair for an existing customer without registering it again', () => {
			repairApiMock.create.mockReturnValue(of({ id: 41 }))
			setupStore()

			store.createRepair(createIntake(7))

			expect(customerApiMock.create.calls).toHaveLength(0)
			const request = repairApiMock.create.calls[0][0] as {
				repairToCreate: { customer: { id: number }; issue: string }
				user: { id: number }
			}
			expect(request.repairToCreate.customer.id).toBe(7)
			expect(request.repairToCreate.issue).toBe('Pantalla rota')
			expect(request.user.id).toBe(5)
			expect(store.createdRepairId()).toBe(41)
			expect(store.isCreating()).toBe(false)
			expect(repairStoreMock.reload.calls).toHaveLength(1)
		})

		it('registers a new customer first and uses its id', () => {
			customerApiMock.create.mockReturnValue(of([CUSTOMER_DTO, true]))
			repairApiMock.create.mockReturnValue(of({ id: 42 }))
			setupStore()

			store.createRepair(createIntake(null))

			const customerRequest = customerApiMock.create.calls[0][0] as { dni: number; id?: number }
			expect(customerRequest.dni).toBe(30123456)
			expect(customerRequest).not.toHaveProperty('id')
			const repairRequest = repairApiMock.create.calls[0][0] as { repairToCreate: { customer: { id: number } } }
			expect(repairRequest.repairToCreate.customer.id).toBe(7)
			expect(store.createdRepairId()).toBe(42)
		})

		it('reports an error and skips the repair when the customer could not be registered', () => {
			customerApiMock.create.mockReturnValue(of([null, false]))
			setupStore()

			store.createRepair(createIntake(null))

			expect(repairApiMock.create.calls).toHaveLength(0)
			expect(store.mutationError().create).toBe('Failed to create the repair')
			expect(store.isCreating()).toBe(false)
			expect(store.createdRepairId()).toBeNull()
		})

		it('reports an error when the API does not return the created repair', () => {
			repairApiMock.create.mockReturnValue(of({}))
			setupStore()

			store.createRepair(createIntake(7))

			expect(store.mutationError().create).toBe('Failed to create the repair')
			expect(repairStoreMock.reload.calls).toHaveLength(0)
		})

		it('reports an error when the request fails', () => {
			repairApiMock.create.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.createRepair(createIntake(7))

			expect(store.mutationError().create).toBe('Failed to create the repair')
			expect(store.hasMutationError()).toBe(true)
		})

		it('reports an error and skips every request when there is no signed-in user', () => {
			currentUser.set(null)
			setupStore()

			store.createRepair(createIntake(null))

			expect(customerApiMock.create.calls).toHaveLength(0)
			expect(repairApiMock.create.calls).toHaveLength(0)
			expect(store.mutationError().create).toBe('Failed to create the repair')
		})

		it('clears the error on demand', () => {
			repairApiMock.create.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()
			store.createRepair(createIntake(7))

			store.clearMutationError()

			expect(store.mutationError().create).toBeNull()
		})
	})

	describe('reset', () => {
		it('restores the initial state', () => {
			customerApiMock.getByDni.mockReturnValue(of(CUSTOMER_DTO))
			repairApiMock.create.mockReturnValue(of({ id: 41 }))
			setupStore()
			store.lookupCustomer(30123456)
			store.createRepair(createIntake(7))

			store.reset()

			expect(store.lookupStatus()).toBe('idle')
			expect(store.customer()).toBeNull()
			expect(store.createdRepairId()).toBeNull()
		})
	})
})
