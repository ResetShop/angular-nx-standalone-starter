import { TestBed } from '@angular/core/testing'
import type { OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import { OfficeBranchApi } from '@providers/office-branch/office-branch.interface'
import { InMemoryOfficeBranchApi } from '@providers/office-branch/office-branch.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { OfficeBranchStore } from './office-branch.store'

const centro: OfficeBranchDto = { id: 1, name: 'Centro', address: 'San Martín 100' }
const norte: OfficeBranchDto = { id: 2, name: 'Norte', address: 'Belgrano 200' }

describe('OfficeBranchStore', () => {
	let api: InMemoryOfficeBranchApi

	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()
		api = new InMemoryOfficeBranchApi()
		api.seed([centro, norte])

		TestBed.configureTestingModule({ providers: [{ provide: OfficeBranchApi, useValue: api }] })
	})

	describe('initial state', () => {
		it('has no current branch when nothing was assigned before', () => {
			const store = TestBed.inject(OfficeBranchStore)

			expect(store.currentBranch()).toBeNull()
			expect(store.hasCurrentBranch()).toBe(false)
		})

		it('restores the branch assigned in a previous session', () => {
			localStorage.setItem('officeBranch.current', JSON.stringify(centro))

			const store = TestBed.inject(OfficeBranchStore)

			expect(store.currentBranch()).toEqual(centro)
			expect(store.hasCurrentBranch()).toBe(true)
		})

		it('ignores a corrupted stored branch', () => {
			localStorage.setItem('officeBranch.current', '{oops')

			expect(TestBed.inject(OfficeBranchStore).currentBranch()).toBeNull()
			expect(localStorage.getItem('officeBranch.current')).toBeNull()
		})
	})

	describe('loadBranches', () => {
		it('loads the available branches', () => {
			const store = TestBed.inject(OfficeBranchStore)

			store.loadBranches()

			expect(store.branches()).toEqual([centro, norte])
			expect(store.isLoadingList()).toBe(false)
			expect(store.hasReadError()).toBe(false)
		})

		it('records a read error when the request fails', () => {
			api.setError('getAll', new Error('offline'))
			const store = TestBed.inject(OfficeBranchStore)

			store.loadBranches()

			expect(store.branches()).toEqual([])
			expect(store.isLoadingList()).toBe(false)
			expect(store.readError().list).toBe('Failed to load branches')
			expect(store.hasReadError()).toBe(true)
		})

		it('clears a previous read error on the next attempt', () => {
			api.setError('getAll', new Error('offline'))
			const store = TestBed.inject(OfficeBranchStore)
			store.loadBranches()
			api.clearErrors()

			store.reload()

			expect(store.hasReadError()).toBe(false)
			expect(store.branches()).toHaveLength(2)
		})
	})

	describe('assign', () => {
		it('sets the current branch and persists it', () => {
			const store = TestBed.inject(OfficeBranchStore)

			store.assign(norte)

			expect(store.currentBranch()).toEqual(norte)
			expect(JSON.parse(localStorage.getItem('officeBranch.current') ?? 'null')).toEqual(norte)
		})
	})

	describe('createBranch', () => {
		it('creates the branch and reloads the list from the server', () => {
			const store = TestBed.inject(OfficeBranchStore)

			store.createBranch({ name: 'Sur', address: 'Mitre 300' })

			expect(store.isCreating()).toBe(false)
			expect(store.branches().map((branch) => branch.name)).toEqual(['Centro', 'Norte', 'Sur'])
		})

		it('records a mutation error when creating fails', () => {
			api.setError('create', new Error('conflict'))
			const store = TestBed.inject(OfficeBranchStore)

			store.createBranch({ name: 'Sur', address: 'Mitre 300' })

			expect(store.isCreating()).toBe(false)
			expect(store.mutationError().create).toBe('Failed to create branch')
			expect(store.hasMutationError()).toBe(true)
		})

		it('clearErrors resets both error groups', () => {
			api.setError('create', new Error('conflict'))
			const store = TestBed.inject(OfficeBranchStore)
			store.createBranch({ name: 'Sur', address: 'Mitre 300' })

			store.clearErrors()

			expect(store.hasMutationError()).toBe(false)
			expect(store.hasReadError()).toBe(false)
		})
	})
})
