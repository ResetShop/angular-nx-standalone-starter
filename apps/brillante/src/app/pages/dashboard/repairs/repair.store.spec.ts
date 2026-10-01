import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import type { OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import { mapRepairDto } from '@domain/repair/repair.mapper'
import type { Repair } from '@domain/repair/repair.model'
import type { IUser } from '@domain/user/user.interface'
import { createMockUser } from '@mocks/user.mock'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	type MockFn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { NEVER, of, throwError } from 'rxjs'
import { RepairApi } from './repair.interface'
import { createMockRepairDto, MOCK_REPAIR_STATUSES } from './repair.mock'
import { RepairStore } from './repair.store'

const PAYMENT_METHODS: PaymentMethodDto[] = [
	{ id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] },
]
const BRANCH: OfficeBranchDto = { id: 3, name: 'Centro', address: '25 de Mayo 3567' }

describe('RepairStore', () => {
	let store: InstanceType<typeof RepairStore>
	let repairApiMock: Record<keyof RepairApi, MockFn>
	let paymentMethodApiMock: Record<keyof PaymentMethodApi, MockFn>
	let currentUser: ReturnType<typeof signal<IUser | null>>

	/**
	 * withHooks.onInit loads the list, the statuses and the payment methods immediately, so the
	 * API mocks must be configured before calling this.
	 */
	function setupStore(): void {
		TestBed.configureTestingModule({
			providers: [
				RepairStore,
				{ provide: RepairApi, useValue: repairApiMock },
				{ provide: PaymentMethodApi, useValue: paymentMethodApiMock },
				{ provide: AuthStore, useValue: { currentUser } },
				{ provide: OfficeBranchStore, useValue: { currentBranch: signal(BRANCH) } },
			],
		})
		store = TestBed.inject(RepairStore)
		TestBed.tick()
	}

	function lastCallArg<T>(mock: MockFn): T {
		return mock.calls[mock.calls.length - 1][0] as T
	}

	beforeEach(() => {
		clearAllMocks()
		currentUser = signal<IUser | null>(createMockUser({ id: 5 }))

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
		paymentMethodApiMock = { getAll: fn() }

		repairApiMock.getAll.mockReturnValue(of([]))
		repairApiMock.getStatuses.mockReturnValue(of(MOCK_REPAIR_STATUSES))
		paymentMethodApiMock.getAll.mockReturnValue(of(PAYMENT_METHODS))
	})

	describe('initial load', () => {
		it('starts loading the list immediately', () => {
			repairApiMock.getAll.mockReturnValue(NEVER)
			setupStore()

			expect(store.isLoadingList()).toBe(true)
			expect(store.isAnyLoading()).toBe(true)
			expect(store.repairs()).toEqual([])
		})

		it('requests the unfinished repairs by default', () => {
			setupStore()

			expect(repairApiMock.getAll.calls[0][0]).toBe(false)
			expect(repairApiMock.getAllByDate.calls).toHaveLength(0)
		})

		it('loads the status and payment method catalogues', () => {
			setupStore()

			expect(store.statuses()).toEqual(MOCK_REPAIR_STATUSES)
			expect(store.paymentMethods()).toEqual(PAYMENT_METHODS)
		})

		it('maps the repairs, most recently updated first', () => {
			repairApiMock.getAll.mockReturnValue(
				of([
					createMockRepairDto({ id: 1, lastUpdate: '2024-05-01T10:00:00.000Z' }),
					createMockRepairDto({ id: 2, lastUpdate: '2024-06-01T10:00:00.000Z', price: '1500.50' }),
				]),
			)
			setupStore()

			expect(store.repairs().map((repair) => repair.id)).toEqual([2, 1])
			expect(store.repairs()[0].price).toBe(1500.5)
			expect(store.isLoadingList()).toBe(false)
			expect(store.readError().list).toBeNull()
		})

		it('records a list error when the request fails', () => {
			repairApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			expect(store.isLoadingList()).toBe(false)
			expect(store.readError().list).toBe('Failed to load repairs')
			expect(store.hasReadError()).toBe(true)
		})

		it('records an error when the statuses cannot be loaded', () => {
			repairApiMock.getStatuses.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			expect(store.readError().statuses).toBe('Failed to load repair statuses')
		})

		it('records an error when the payment methods cannot be loaded', () => {
			paymentMethodApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			expect(store.readError().paymentMethods).toBe('Failed to load payment methods')
		})
	})

	describe('list filters (reactive via listParams)', () => {
		it('re-fetches including finished repairs when showFinished is turned on', () => {
			setupStore()

			store.setShowFinished(true)
			TestBed.tick()

			expect(lastCallArg<boolean>(repairApiMock.getAll)).toBe(true)
		})

		it('fetches by date once both ends of the range are set', () => {
			repairApiMock.getAllByDate.mockReturnValue(of([]))
			setupStore()
			const dateFrom = new Date(2024, 0, 1)
			const dateTo = new Date(2024, 0, 31)

			store.setDateRange(dateFrom, dateTo)
			TestBed.tick()

			expect(lastCallArg(repairApiMock.getAllByDate)).toEqual({ dateFrom, dateTo, showFinished: false })
		})

		it('falls back to the plain list when only one end of the range is set', () => {
			setupStore()
			const before = repairApiMock.getAll.calls.length

			store.setDateRange(new Date(2024, 0, 1), null)
			TestBed.tick()

			expect(repairApiMock.getAll.calls).toHaveLength(before + 1)
			expect(repairApiMock.getAllByDate.calls).toHaveLength(0)
		})
	})

	describe('client-side filtering and pagination', () => {
		function seed(count: number): void {
			const dtos = Array.from({ length: count }, (_, index) =>
				createMockRepairDto({
					id: index + 1,
					lastUpdate: new Date(2024, 0, index + 1).toISOString(),
					status:
						index % 2 === 0
							? { id: RepairStatusId.ENTERED, description: 'Ingresado' }
							: { id: RepairStatusId.IN_PROGRESS, description: 'En progreso' },
					device: { ...createMockRepairDto().device, model: index === 0 ? 'Zenfone' : 'S21' },
				}),
			)
			repairApiMock.getAll.mockReturnValue(of(dtos))
		}

		it('filters by status', () => {
			seed(6)
			setupStore()

			store.setStatusFilter(RepairStatusId.IN_PROGRESS)

			expect(store.filteredRepairs().map((repair) => repair.id)).toEqual([6, 4, 2])
			expect(store.totalItems()).toBe(3)
		})

		it('filters by the search text over id, customer, brand, model and device id', async () => {
			useFakeTimers()
			seed(6)
			setupStore()

			store.setSearchQuery('zenfone')
			await advanceTimersByTimeAsync(300)
			TestBed.tick()
			useRealTimers()

			expect(store.filteredRepairs().map((repair) => repair.id)).toEqual([1])
		})

		it('combines the status filter and the search text', async () => {
			useFakeTimers()
			seed(6)
			setupStore()

			store.setStatusFilter(RepairStatusId.IN_PROGRESS)
			store.setSearchQuery('zenfone')
			await advanceTimersByTimeAsync(300)
			useRealTimers()

			expect(store.filteredRepairs()).toEqual([])
		})

		it('slices the filtered repairs into pages', () => {
			seed(20)
			setupStore()

			expect(store.totalPages()).toBe(2)
			expect(store.pagedRepairs()).toHaveLength(15)

			store.setPage(2)

			expect(store.pagedRepairs()).toHaveLength(5)
			expect(store.activePage()).toBe(2)
		})

		it('clamps the active page when the filtered list shrinks', () => {
			seed(20)
			setupStore()
			store.setPage(2)

			store.setStatusFilter(RepairStatusId.IN_PROGRESS)

			expect(store.activePage()).toBe(1)
			expect(store.pagedRepairs()).toHaveLength(10)
		})

		it('returns to the first page when the page size changes', () => {
			seed(20)
			setupStore()
			store.setPage(2)

			store.setPageSize(5)

			expect(store.currentPage()).toBe(1)
			expect(store.totalPages()).toBe(4)
		})
	})

	describe('loadRepair and loadHistory', () => {
		it('loads the selected repair', () => {
			setupStore()
			repairApiMock.getById.mockReturnValue(of(createMockRepairDto({ id: 9, price: '200' })))

			store.loadRepair(9)

			expect(repairApiMock.getById.calls[0][0]).toBe(9)
			expect(store.selectedRepair()?.id).toBe(9)
			expect(store.selectedRepair()?.price).toBe(200)
			expect(store.isLoadingDetail()).toBe(false)
		})

		it('records a detail error when the repair cannot be loaded', () => {
			setupStore()
			repairApiMock.getById.mockReturnValue(throwError(() => new Error('not found')))

			store.loadRepair(9)

			expect(store.readError().detail).toBe('Failed to load repair')
			expect(store.selectedRepair()).toBeNull()
		})

		it('loads the history, newest change first', () => {
			setupStore()
			const status = { id: 1, description: 'En progreso' }
			const entry = { cost: 0, price: 0, paymentInAdvance: 0, note: '', user: null, updatedAt: null, status }
			repairApiMock.getHistory.mockReturnValue(
				of([
					{ ...entry, id: 1, createdAt: '2024-05-01T10:00:00.000Z' },
					{ ...entry, id: 2, createdAt: '2024-05-03T10:00:00.000Z' },
				]),
			)

			store.loadHistory(9)

			expect(store.history().map((item) => item.id)).toEqual([2, 1])
			expect(store.isLoadingHistory()).toBe(false)
		})

		it('records a history error on failure', () => {
			setupStore()
			repairApiMock.getHistory.mockReturnValue(throwError(() => new Error('boom')))

			store.loadHistory(9)

			expect(store.readError().history).toBe('Failed to load repair history')
		})

		it('clears the selection and its history', () => {
			setupStore()
			repairApiMock.getById.mockReturnValue(of(createMockRepairDto({ id: 9 })))
			store.loadRepair(9)

			store.selectRepair(null)

			expect(store.selectedRepair()).toBeNull()
			expect(store.history()).toEqual([])
		})
	})

	describe('updateDeviceInfo', () => {
		function selectedRepair(): Repair {
			return mapRepairDto(createMockRepairDto({ id: 9 }))
		}

		it('sends the repair and reloads the detail and the list on success', () => {
			setupStore()
			repairApiMock.updateDeviceInfo.mockReturnValue(of([1]))
			repairApiMock.getById.mockReturnValue(of(createMockRepairDto({ id: 9 })))
			repairApiMock.getHistory.mockReturnValue(of([]))
			const listCalls = repairApiMock.getAll.calls.length

			store.updateDeviceInfo(selectedRepair())

			expect(lastCallArg<{ id: number }>(repairApiMock.updateDeviceInfo).id).toBe(9)
			expect(store.isUpdatingDevice()).toBe(false)
			expect(repairApiMock.getById.calls).toHaveLength(1)
			expect(repairApiMock.getAll.calls).toHaveLength(listCalls + 1)
		})

		it('reports an error when the API does not confirm the update', () => {
			setupStore()
			repairApiMock.updateDeviceInfo.mockReturnValue(of(null))

			store.updateDeviceInfo(selectedRepair())

			expect(store.isUpdatingDevice()).toBe(false)
			expect(store.mutationError().updateDevice).toBe('Failed to update the device information')
			expect(repairApiMock.getById.calls).toHaveLength(0)
		})

		it('reports an error when the request fails', () => {
			setupStore()
			repairApiMock.updateDeviceInfo.mockReturnValue(throwError(() => new Error('boom')))

			store.updateDeviceInfo(selectedRepair())

			expect(store.mutationError().updateDevice).toBe('Failed to update the device information')
			expect(store.hasMutationError()).toBe(true)
		})

		it('clears the error on demand', () => {
			setupStore()
			repairApiMock.updateDeviceInfo.mockReturnValue(throwError(() => new Error('boom')))
			store.updateDeviceInfo(selectedRepair())

			store.clearMutationError('updateDevice')

			expect(store.mutationError().updateDevice).toBeNull()
		})
	})

	describe('updateTrackingInfo', () => {
		const repair = (): Repair => mapRepairDto(createMockRepairDto({ id: 9 }))

		it('sends the repair with the user, the transaction flag and the current branch', () => {
			setupStore()
			repairApiMock.updateTrackingInfo.mockReturnValue(of([1]))
			repairApiMock.getById.mockReturnValue(of(createMockRepairDto({ id: 9 })))
			repairApiMock.getHistory.mockReturnValue(of([]))

			store.updateTrackingInfo({ repair: repair(), generateTransaction: true })

			const request = lastCallArg<{
				repairToUpdate: { id: number }
				user: { id: number }
				generateTransaction: boolean
				officeBranch: OfficeBranchDto
			}>(repairApiMock.updateTrackingInfo)
			expect(request.repairToUpdate.id).toBe(9)
			expect(request.user.id).toBe(5)
			expect(request.generateTransaction).toBe(true)
			expect(request.officeBranch).toEqual(BRANCH)
			expect(store.isUpdatingTracking()).toBe(false)
			expect(repairApiMock.getHistory.calls).toHaveLength(1)
		})

		it('reports an error when the API answers without a confirmation', () => {
			setupStore()
			repairApiMock.updateTrackingInfo.mockReturnValue(of([]))

			store.updateTrackingInfo({ repair: repair(), generateTransaction: false })

			expect(store.mutationError().updateTracking).toBe('Failed to update the repair')
			expect(store.isUpdatingTracking()).toBe(false)
		})

		it('reports an error and skips the request when there is no signed-in user', () => {
			currentUser.set(null)
			setupStore()

			store.updateTrackingInfo({ repair: repair(), generateTransaction: false })

			expect(repairApiMock.updateTrackingInfo.calls).toHaveLength(0)
			expect(store.mutationError().updateTracking).toBe('Failed to update the repair')
			expect(store.isUpdatingTracking()).toBe(false)
		})

		it('reports an error when the request fails', () => {
			setupStore()
			repairApiMock.updateTrackingInfo.mockReturnValue(throwError(() => new Error('boom')))

			store.updateTrackingInfo({ repair: repair(), generateTransaction: false })

			expect(store.mutationError().updateTracking).toBe('Failed to update the repair')
		})
	})

	describe('deleteRepair', () => {
		it('deletes, clears the selection of the deleted repair and reloads the list', () => {
			setupStore()
			repairApiMock.getById.mockReturnValue(of(createMockRepairDto({ id: 9 })))
			store.loadRepair(9)
			repairApiMock.delete.mockReturnValue(of({ response: 'Deleted repair with id 9' }))
			const listCalls = repairApiMock.getAll.calls.length

			store.deleteRepair(9)

			expect(repairApiMock.delete.calls[0][0]).toBe(9)
			expect(store.selectedRepair()).toBeNull()
			expect(store.isDeleting()).toBe(false)
			expect(repairApiMock.getAll.calls).toHaveLength(listCalls + 1)
		})

		it('keeps the selection when another repair is deleted', () => {
			setupStore()
			repairApiMock.getById.mockReturnValue(of(createMockRepairDto({ id: 9 })))
			store.loadRepair(9)
			repairApiMock.delete.mockReturnValue(of({ response: 'ok' }))

			store.deleteRepair(4)

			expect(store.selectedRepair()?.id).toBe(9)
		})

		it('reports an error when the deletion fails', () => {
			setupStore()
			repairApiMock.delete.mockReturnValue(throwError(() => new Error('boom')))

			store.deleteRepair(9)

			expect(store.isDeleting()).toBe(false)
			expect(store.mutationError().delete).toBe('Failed to delete the repair')
		})
	})

	describe('reload and clearErrors', () => {
		it('reloads the list with the current filters', () => {
			setupStore()
			store.setShowFinished(true)
			TestBed.tick()
			const calls = repairApiMock.getAll.calls.length

			store.reload()

			expect(repairApiMock.getAll.calls).toHaveLength(calls + 1)
			expect(lastCallArg<boolean>(repairApiMock.getAll)).toBe(true)
		})

		it('clears every read and mutation error', () => {
			repairApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.clearErrors()

			expect(store.hasReadError()).toBe(false)
			expect(store.hasMutationError()).toBe(false)
		})
	})
})
