import { TestBed } from '@angular/core/testing'
import { createMockUserDto } from '@mocks/user-dto.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { UserApi } from '@providers/user/user.interface'
import { clearAllMocks, fn, type MockFn, spyOn } from '@resetshop/util/test-utils'
import { NEVER, of, throwError } from 'rxjs'
import { ManagedUsersStore } from './managed-users.store'

describe('ManagedUsersStore', () => {
	let store: InstanceType<typeof ManagedUsersStore>
	let apiMock: Record<keyof UserApi, MockFn>

	/**
	 * `onInit` loads the list immediately, so `getAll` must be mocked before calling this.
	 */
	function setupStore(): void {
		TestBed.configureTestingModule({
			providers: [ManagedUsersStore, { provide: UserApi, useValue: apiMock }, provideTranslationMock()],
		})
		store = TestBed.inject(ManagedUsersStore)
		TestBed.tick()
	}

	beforeEach(() => {
		clearAllMocks()
		spyOn(console, 'error')

		apiMock = {
			getAll: fn(),
			getById: fn(),
			register: fn(),
			update: fn(),
			updateCustomerUser: fn(),
			delete: fn(),
		}
		apiMock.getAll.mockReturnValue(of([]))
	})

	describe('initial state', () => {
		it('should start loading immediately via onInit', () => {
			apiMock.getAll.mockReturnValue(NEVER)
			setupStore()

			expect(store.users()).toEqual([])
			expect(store.searchQuery()).toBe('')
			expect(store.isLoadingList()).toBe(true)
			expect(store.isCreating()).toBe(false)
			expect(store.isUpdating()).toBe(false)
			expect(store.isDeleting()).toBe(false)
			expect(store.readError()).toEqual({ list: null })
			expect(store.mutationError()).toEqual({ create: null, update: null, delete: null })
		})
	})

	describe('loadUsers', () => {
		it('should map the users to domain users', () => {
			apiMock.getAll.mockReturnValue(of([createMockUserDto({ id: 4, firstName: 'Ana', lastName: 'Gomez' })]))
			setupStore()

			expect(store.users()).toHaveLength(1)
			expect(store.users()[0].id).toBe(4)
			expect(store.users()[0].fullName).toBe('Ana Gomez')
			expect(store.isLoadingList()).toBe(false)
		})

		it('should expose the read error and log when loading fails', () => {
			apiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			expect(store.readError().list).toBe('MANAGED_USERS.ERRORS.LOAD')
			expect(store.hasReadError()).toBe(true)
			expect(store.isLoadingList()).toBe(false)
			expect(store.users()).toEqual([])
		})

		it('should reload the list on reload()', () => {
			setupStore()
			apiMock.getAll.mockReturnValue(of([createMockUserDto({ id: 9 })]))

			store.reload()

			expect(store.users().map((user) => user.id)).toEqual([9])
		})
	})

	describe('filteredUsers', () => {
		beforeEach(() => {
			apiMock.getAll.mockReturnValue(
				of([
					createMockUserDto({ id: 1, firstName: 'Ana', lastName: 'Gomez', userName: 'agomez', email: 'ana@shop.com' }),
					createMockUserDto({
						id: 2,
						firstName: 'Bruno',
						lastName: 'Diaz',
						userName: 'bdiaz',
						email: 'bruno@shop.com',
					}),
				]),
			)
			setupStore()
		})

		it('should return every user while the query is empty', () => {
			expect(store.filteredUsers()).toHaveLength(2)
		})

		it.each([
			['name', 'gomez', 1],
			['user name', 'BDIAZ', 2],
			['email', 'bruno@', 2],
		])('should match the query against the %s ignoring case', (_field, query, expectedId) => {
			store.setSearchQuery(query)

			expect(store.filteredUsers().map((user) => user.id)).toEqual([expectedId])
		})

		it('should return nothing when no user matches', () => {
			store.setSearchQuery('nobody')

			expect(store.filteredUsers()).toEqual([])
		})
	})

	describe('createUser', () => {
		const body = {
			email: 'new@shop.com',
			firstName: 'New',
			lastName: 'User',
			userName: 'nuser',
			roles: [{ id: 6, description: 'EMPLOYEE' }],
		}

		it('should register the user and reload the list', () => {
			apiMock.register.mockReturnValue(of(createMockUserDto({ id: 5 })))
			setupStore()
			apiMock.getAll.mockReturnValue(of([createMockUserDto({ id: 5 })]))

			store.createUser(body)

			expect(apiMock.register.calls).toEqual([[body]])
			expect(store.isCreating()).toBe(false)
			expect(store.mutationError().create).toBeNull()
			expect(store.users().map((user) => user.id)).toEqual([5])
		})

		it('should flag the operation as in flight', () => {
			apiMock.register.mockReturnValue(NEVER)
			setupStore()

			store.createUser(body)

			expect(store.isCreating()).toBe(true)
			expect(store.isMutating()).toBe(true)
			expect(store.isAnyLoading()).toBe(true)
		})

		it('should expose the create error when registration fails', () => {
			apiMock.register.mockReturnValue(throwError(() => new Error('conflict')))
			setupStore()

			store.createUser(body)

			expect(store.mutationError().create).toBe('MANAGED_USERS.ERRORS.CREATE')
			expect(store.hasMutationError()).toBe(true)
			expect(store.isCreating()).toBe(false)
		})
	})

	describe('updateUser', () => {
		it('should update the user and reload the list', () => {
			apiMock.update.mockReturnValue(of([1]))
			setupStore()
			apiMock.getAll.mockReturnValue(of([createMockUserDto({ id: 3, firstName: 'Changed' })]))

			store.updateUser({ id: 3, firstName: 'Changed' })

			expect(apiMock.update.calls).toEqual([[{ id: 3, firstName: 'Changed' }]])
			expect(store.isUpdating()).toBe(false)
			expect(store.users()[0].firstName).toBe('Changed')
		})

		it('should expose the update error when the update fails', () => {
			apiMock.update.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.updateUser({ id: 3, firstName: 'Changed' })

			expect(store.mutationError().update).toBe('MANAGED_USERS.ERRORS.UPDATE')
			expect(store.isUpdating()).toBe(false)
		})
	})

	describe('deleteUser', () => {
		it('should delete the user and reload the list', () => {
			apiMock.delete.mockReturnValue(of(undefined))
			apiMock.getAll.mockReturnValue(of([createMockUserDto({ id: 1 }), createMockUserDto({ id: 2 })]))
			setupStore()
			apiMock.getAll.mockReturnValue(of([createMockUserDto({ id: 2 })]))

			store.deleteUser(1)

			expect(apiMock.delete.calls).toEqual([[1]])
			expect(store.isDeleting()).toBe(false)
			expect(store.users().map((user) => user.id)).toEqual([2])
		})

		it('should expose the delete error when deletion fails', () => {
			apiMock.delete.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()

			store.deleteUser(1)

			expect(store.mutationError().delete).toBe('MANAGED_USERS.ERRORS.DELETE')
			expect(store.isDeleting()).toBe(false)
		})
	})

	describe('error clearing', () => {
		it('should clear a single mutation error', () => {
			apiMock.register.mockReturnValue(throwError(() => new Error('boom')))
			apiMock.delete.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()
			store.createUser({ email: 'a@b.c', firstName: 'A', lastName: 'B', userName: 'ab', roles: [] })
			store.deleteUser(1)

			store.clearMutationError('create')

			expect(store.mutationError().create).toBeNull()
			expect(store.mutationError().delete).toBe('MANAGED_USERS.ERRORS.DELETE')
		})

		it('should clear every error', () => {
			apiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))
			apiMock.delete.mockReturnValue(throwError(() => new Error('boom')))
			setupStore()
			store.deleteUser(1)

			store.clearErrors()

			expect(store.readError()).toEqual({ list: null })
			expect(store.mutationError()).toEqual({ create: null, update: null, delete: null })
		})
	})
})
