import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import type { CustomerDetails } from '@domain/customer/customer.interface'
import { createMockCustomerDto } from '@domain/customer/customer.mock'
import { CustomerApi } from '@providers/customer/customer.interface'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	type MockFn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { NEVER, of, throwError } from 'rxjs'
import { CustomersStore } from './customers.store'

describe('CustomersStore', () => {
	let store: InstanceType<typeof CustomersStore>
	let apiMock: Record<keyof CustomerApi, MockFn>

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
			providers: [CustomersStore, { provide: CustomerApi, useValue: apiMock }],
		})
		store = TestBed.inject(CustomersStore)
		TestBed.tick()
	}

	beforeEach(() => {
		clearAllMocks()
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

	describe('initial state', () => {
		it('starts loading the first page immediately', () => {
			apiMock.getAll.mockReturnValue(NEVER)
			setupStore()

			expect(apiMock.getAll.calls.at(-1)).toEqual([0, 10])
			expect(store.isLoadingList()).toBe(true)
			expect(store.customers()).toEqual([])
			expect(store.createOutcome()).toBeNull()
			expect(store.readError()).toEqual({ list: null })
			expect(store.mutationError()).toEqual({ create: null, update: null })
		})

		it('exposes the derived pagination signals once loaded', () => {
			setupStore()

			expect(store.totalPages()).toBe(0)
			expect(store.hasNextPage()).toBe(false)
			expect(store.hasPreviousPage()).toBe(false)
			expect(store.isAnyLoading()).toBe(false)
			expect(store.hasReadError()).toBe(false)
			expect(store.hasMutationError()).toBe(false)
		})
	})

	describe('loadCustomers', () => {
		it('maps the rows into domain customers and stores the total count', () => {
			apiMock.getAll.mockReturnValue(of({ count: 25, rows: [createMockCustomerDto({ id: 5 })] }))
			setupStore()

			expect(store.customers()).toHaveLength(1)
			expect(store.customers()[0].id).toBe(5)
			expect(store.customers()[0].birthDate).toBeInstanceOf(Date)
			expect(store.totalItems()).toBe(25)
			expect(store.totalPages()).toBe(3)
			expect(store.hasNextPage()).toBe(true)
			expect(store.isLoadingList()).toBe(false)
		})

		it('records a list error and logs it when the request fails', () => {
			apiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			expect(store.readError().list).toBe('Failed to load customers')
			expect(store.hasReadError()).toBe(true)
			expect(store.isLoadingList()).toBe(false)
		})

		it('re-fetches with the new offset when the page changes', () => {
			setupStore()

			store.setPage(3)
			TestBed.tick()

			expect(apiMock.getAll.calls.at(-1)).toEqual([20, 10])
		})

		it('resets to the first page when the page size changes', () => {
			setupStore()
			store.setPage(3)
			TestBed.tick()

			store.setPageSize(25)
			TestBed.tick()

			expect(store.currentPage()).toBe(1)
			expect(apiMock.getAll.calls.at(-1)).toEqual([0, 25])
		})

		it('clears a previous list error when loading again', () => {
			apiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()
			apiMock.getAll.mockReturnValue(of({ count: 0, rows: [] }))

			store.reload()

			expect(store.readError().list).toBeNull()
		})
	})

	describe('search', () => {
		beforeEach(() => {
			useFakeTimers()
		})

		afterEach(() => {
			useRealTimers()
		})

		async function search(query: string): Promise<void> {
			store.setSearchQuery(query)
			await advanceTimersByTimeAsync(300)
			TestBed.tick()
		}

		it('looks a numeric term up by DNI', async () => {
			apiMock.getByDni.mockReturnValue(of(createMockCustomerDto({ id: 9, dni: 30123456 })))
			setupStore()

			await search('30123456')

			expect(apiMock.getByDni.calls.at(-1)).toEqual([30123456])
			expect(store.customers().map((customer) => customer.id)).toEqual([9])
			expect(store.totalItems()).toBe(1)
		})

		it('looks a term containing @ up by email', async () => {
			apiMock.getByEmail.mockReturnValue(of(createMockCustomerDto({ id: 4 })))
			setupStore()

			await search('ana@brillante.test')

			expect(apiMock.getByEmail.calls.at(-1)).toEqual(['ana@brillante.test'])
			expect(store.customers()).toHaveLength(1)
		})

		it('shows an empty list when the lookup finds nobody', async () => {
			apiMock.getByDni.mockReturnValue(of(null))
			setupStore()

			await search('99999999')

			expect(store.customers()).toEqual([])
			expect(store.totalItems()).toBe(0)
			expect(store.readError().list).toBeNull()
		})

		it('does not call the API for text that is neither a DNI nor an email', async () => {
			setupStore()
			apiMock.getAll.mockClear()

			await search('ana')

			expect(apiMock.getByDni.calls).toHaveLength(0)
			expect(apiMock.getByEmail.calls).toHaveLength(0)
			expect(store.customers()).toEqual([])
		})

		it('goes back to the paginated list when the search is cleared', async () => {
			apiMock.getByDni.mockReturnValue(of(null))
			setupStore()
			await search('123')

			await search('')

			expect(apiMock.getAll.calls.at(-1)).toEqual([0, 10])
		})

		it('debounces rapid input and trims the stored query', async () => {
			apiMock.getByDni.mockReturnValue(of(null))
			setupStore()

			store.setSearchQuery('1')
			store.setSearchQuery(' 12 ')
			await advanceTimersByTimeAsync(300)
			TestBed.tick()

			expect(store.searchQuery()).toBe('12')
			expect(apiMock.getByDni.calls).toHaveLength(1)
		})
	})

	describe('createCustomer', () => {
		it('sends the wire request, flags a created customer and reloads the list', () => {
			apiMock.create.mockReturnValue(of([createMockCustomerDto({ id: 10 }), true]))
			setupStore()
			apiMock.getAll.mockClear()

			store.createCustomer(details)

			expect(apiMock.create.calls[0][0]).toEqual({
				dni: 30123456,
				firstName: 'Ana',
				lastName: 'Perez',
				email: 'ana@brillante.test',
				birthDate: '1990-05-20T03:00:00.000Z',
				address: 'Calle 123',
				telephone: '3511234567',
			})
			expect(store.createOutcome()).toBe('created')
			expect(store.isCreating()).toBe(false)
			expect(apiMock.getAll.calls).toHaveLength(1)
		})

		it('flags an existing customer when the API found the DNI already registered', () => {
			apiMock.create.mockReturnValue(of([createMockCustomerDto({ id: 2 }), false]))
			setupStore()

			store.createCustomer(details)

			expect(store.createOutcome()).toBe('existing')
		})

		it('is in progress while the request is pending', () => {
			apiMock.create.mockReturnValue(NEVER)
			setupStore()

			store.createCustomer(details)

			expect(store.isCreating()).toBe(true)
			expect(store.isMutating()).toBe(true)
		})

		it('uses the server error message when the request fails', () => {
			apiMock.create.mockReturnValue(
				throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'Invalid DNI' } })),
			)
			setupStore()

			store.createCustomer(details)

			expect(store.mutationError().create).toBe('Invalid DNI')
			expect(store.isCreating()).toBe(false)
			expect(store.createOutcome()).toBeNull()
		})

		it('falls back to a generic message for an unstructured error', () => {
			apiMock.create.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.createCustomer(details)

			expect(store.mutationError().create).toBe('Failed to create customer')
			expect(store.hasMutationError()).toBe(true)
		})

		it('clears the create error on demand', () => {
			apiMock.create.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()
			store.createCustomer(details)

			store.clearMutationError('create')

			expect(store.mutationError().create).toBeNull()
		})
	})

	describe('updateCustomer', () => {
		it('sends the wire request including the id and reloads the list', () => {
			apiMock.update.mockReturnValue(of([1]))
			setupStore()
			apiMock.getAll.mockClear()

			store.updateCustomer({ ...details, id: 7 })

			expect(apiMock.update.calls[0][0]).toEqual(expect.objectContaining({ id: 7, dni: 30123456 }))
			expect(store.isUpdating()).toBe(false)
			expect(apiMock.getAll.calls).toHaveLength(1)
		})

		it('records the update error when the request fails', () => {
			apiMock.update.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.updateCustomer({ ...details, id: 7 })

			expect(store.mutationError().update).toBe('Failed to update customer')
			expect(store.isUpdating()).toBe(false)
		})

		it('clears every error and the create outcome', () => {
			apiMock.update.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()
			store.updateCustomer({ ...details, id: 7 })

			store.clearErrors()

			expect(store.mutationError()).toEqual({ create: null, update: null })
			expect(store.readError()).toEqual({ list: null })
		})
	})
})
