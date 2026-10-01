import { TestBed } from '@angular/core/testing'
import { createMockConceptDto, createMockConceptTree } from '@mocks/cash-concept-dto.mock'
import { CashConceptApi } from '@providers/cash-concept/cash-concept.interface'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { clearAllMocks, fn, type MockFn, spyOn } from '@resetshop/util/test-utils'
import { NEVER, of, throwError } from 'rxjs'
import { CashConceptsStore } from './cash-concepts.store'

describe('CashConceptsStore', () => {
	let store: InstanceType<typeof CashConceptsStore>
	let apiMock: Record<keyof CashConceptApi, MockFn>

	const incomeTree = createMockConceptTree({ id: 1, description: 'Sales' }, [
		{ id: 11, description: 'Phones' },
		{ id: 12, description: 'System', userAssignable: false },
	])
	const expenseTree = createMockConceptTree(
		{ id: 2, description: 'Supplies', transactionType: { id: 0, description: 'Egreso' } },
		[{ id: 21, description: 'Paper' }],
	)
	const systemRoot = createMockConceptDto({ id: 3, description: 'Register', userAssignable: false })

	/**
	 * `onInit` loads the tree immediately, so `getAll` must be mocked before calling this.
	 */
	function setupStore(): void {
		TestBed.configureTestingModule({
			providers: [CashConceptsStore, { provide: CashConceptApi, useValue: apiMock }, provideTranslationMock()],
		})
		store = TestBed.inject(CashConceptsStore)
		TestBed.tick()
	}

	beforeEach(() => {
		clearAllMocks()
		spyOn(console, 'error')

		apiMock = { getAll: fn(), create: fn(), update: fn(), enable: fn(), disable: fn() }
		apiMock.getAll.mockReturnValue(of([incomeTree, expenseTree, systemRoot]))
	})

	describe('initial state', () => {
		it('should start loading immediately via onInit', () => {
			apiMock.getAll.mockReturnValue(NEVER)
			setupStore()

			expect(store.tree()).toEqual([])
			expect(store.typeFilter()).toBeNull()
			expect(store.isLoadingList()).toBe(true)
			expect(store.readError()).toEqual({ list: null })
			expect(store.mutationError()).toEqual({ create: null, update: null, setEnabled: null })
		})
	})

	describe('loadConcepts', () => {
		it('should keep the tree and derive the concepts from it', () => {
			setupStore()

			expect(store.tree()).toHaveLength(3)
			expect(store.concepts().map((concept) => concept.id)).toEqual([1, 2, 3])
			expect(store.isLoadingList()).toBe(false)
		})

		it('should expose the read error and log when loading fails', () => {
			apiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			expect(store.readError().list).toBe('CASH_CONCEPTS.ERRORS.LOAD')
			expect(store.hasReadError()).toBe(true)
			expect(store.isLoadingList()).toBe(false)
		})
	})

	describe('rows', () => {
		beforeEach(() => setupStore())

		it('should list the assignable concepts followed by their assignable subconcepts', () => {
			expect(store.rows().map((row) => [row.id, row.level])).toEqual([
				[1, 0],
				[11, 1],
				[2, 0],
				[21, 1],
			])
		})

		it('should narrow the rows to the selected transaction type', () => {
			store.setTypeFilter(0)

			expect(store.rows().map((row) => row.id)).toEqual([2, 21])
		})

		it('should list every type again when the filter is cleared', () => {
			store.setTypeFilter(1)
			store.setTypeFilter(null)

			expect(store.rows()).toHaveLength(4)
		})

		it('should offer only assignable concepts as parents', () => {
			expect(store.parentCandidates().map((concept) => concept.id)).toEqual([1, 2])
		})
	})

	describe('createConcept', () => {
		it('should create a top level concept of the chosen type and reload the tree', () => {
			apiMock.create.mockReturnValue(of(createMockConceptDto({ id: 50 })))
			setupStore()

			store.createConcept({
				description: '  Rent ',
				transactionTypeId: 0,
				parentId: null,
				userAssignable: false,
				modifiable: true,
			})

			const [request] = apiMock.create.calls[0]
			expect(request).toMatchObject({
				description: 'Rent',
				transactionType: { id: 0, description: 'Egreso' },
				parent: null,
				userAssignable: true,
				modifiable: true,
				enabled: true,
			})
			expect(apiMock.getAll.calls).toHaveLength(2)
			expect(store.isCreating()).toBe(false)
		})

		it('should create a subconcept that inherits the type of its parent', () => {
			apiMock.create.mockReturnValue(of(createMockConceptDto({ id: 51 })))
			setupStore()

			store.createConcept({
				description: 'Tablets',
				transactionTypeId: 0,
				parentId: 1,
				userAssignable: true,
				modifiable: false,
			})

			const [request] = apiMock.create.calls[0]
			expect(request).toMatchObject({
				description: 'Tablets',
				transactionType: { id: 1, description: 'Ingreso' },
				parent: { id: 1, children: [] },
				modifiable: false,
			})
		})

		it('should flag the operation as in flight', () => {
			apiMock.create.mockReturnValue(NEVER)
			setupStore()

			store.createConcept({
				description: 'Rent',
				transactionTypeId: 1,
				parentId: null,
				userAssignable: true,
				modifiable: true,
			})

			expect(store.isCreating()).toBe(true)
			expect(store.isMutating()).toBe(true)
			expect(store.isAnyLoading()).toBe(true)
		})

		it('should expose the create error when creation fails', () => {
			apiMock.create.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.createConcept({
				description: 'Rent',
				transactionTypeId: 1,
				parentId: null,
				userAssignable: true,
				modifiable: true,
			})

			expect(store.mutationError().create).toBe('CASH_CONCEPTS.ERRORS.CREATE')
			expect(store.hasMutationError()).toBe(true)
			expect(store.isCreating()).toBe(false)
		})
	})

	describe('updateConcept', () => {
		it('should send the concept with the edited fields and reload the tree', () => {
			apiMock.update.mockReturnValue(of([1]))
			setupStore()

			store.updateConcept({ id: 11, description: ' Smartphones ', userAssignable: false, modifiable: false })

			const [request] = apiMock.update.calls[0]
			expect(request).toMatchObject({
				id: 11,
				description: 'Smartphones',
				userAssignable: false,
				modifiable: false,
				parent: { id: 1 },
			})
			expect(apiMock.getAll.calls).toHaveLength(2)
			expect(store.isUpdating()).toBe(false)
		})

		it('should keep a top level concept assignable whatever the form says', () => {
			apiMock.update.mockReturnValue(of([1]))
			setupStore()

			store.updateConcept({ id: 1, description: 'Sales', userAssignable: false, modifiable: true })

			expect(apiMock.update.calls[0][0]).toMatchObject({ id: 1, userAssignable: true })
		})

		it('should expose the update error when the update fails', () => {
			apiMock.update.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.updateConcept({ id: 11, description: 'Phones', userAssignable: true, modifiable: true })

			expect(store.mutationError().update).toBe('CASH_CONCEPTS.ERRORS.UPDATE')
			expect(store.isUpdating()).toBe(false)
		})

		it('should fail without calling the API when the concept is unknown', () => {
			setupStore()

			store.updateConcept({ id: 999, description: 'Ghost', userAssignable: true, modifiable: true })

			expect(apiMock.update.calls).toHaveLength(0)
			expect(store.mutationError().update).toBe('CASH_CONCEPTS.ERRORS.UPDATE')
			expect(store.isUpdating()).toBe(false)
		})
	})

	describe('setConceptEnabled', () => {
		it('should enable the concept and reload the tree', () => {
			apiMock.enable.mockReturnValue(of([1]))
			setupStore()

			store.setConceptEnabled({ id: 11, enabled: true })

			expect(apiMock.enable.calls[0][0]).toMatchObject({ id: 11 })
			expect(apiMock.disable.calls).toHaveLength(0)
			expect(apiMock.getAll.calls).toHaveLength(2)
			expect(store.isChangingStatus()).toBe(false)
		})

		it('should disable the concept', () => {
			apiMock.disable.mockReturnValue(of([1]))
			setupStore()

			store.setConceptEnabled({ id: 21, enabled: false })

			expect(apiMock.disable.calls[0][0]).toMatchObject({ id: 21 })
			expect(apiMock.enable.calls).toHaveLength(0)
		})

		it('should expose the status error when the change fails', () => {
			apiMock.disable.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.setConceptEnabled({ id: 21, enabled: false })

			expect(store.mutationError().setEnabled).toBe('CASH_CONCEPTS.ERRORS.SET_ENABLED')
			expect(store.isChangingStatus()).toBe(false)
		})

		it('should fail without calling the API when the concept is unknown', () => {
			setupStore()

			store.setConceptEnabled({ id: 999, enabled: true })

			expect(apiMock.enable.calls).toHaveLength(0)
			expect(store.mutationError().setEnabled).toBe('CASH_CONCEPTS.ERRORS.SET_ENABLED')
		})
	})

	describe('error clearing', () => {
		it('should clear a single mutation error', () => {
			apiMock.create.mockReturnValue(throwError(() => new Error('boom')))
			apiMock.enable.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()
			store.createConcept({
				description: 'Rent',
				transactionTypeId: 1,
				parentId: null,
				userAssignable: true,
				modifiable: true,
			})
			store.setConceptEnabled({ id: 11, enabled: true })

			store.clearMutationError('create')

			expect(store.mutationError().create).toBeNull()
			expect(store.mutationError().setEnabled).toBe('CASH_CONCEPTS.ERRORS.SET_ENABLED')
		})

		it('should clear every error', () => {
			apiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.clearErrors()

			expect(store.readError()).toEqual({ list: null })
			expect(store.mutationError()).toEqual({ create: null, update: null, setEnabled: null })
		})

		it('should reload on reload()', () => {
			setupStore()

			store.reload()

			expect(apiMock.getAll.calls).toHaveLength(2)
		})
	})
})
