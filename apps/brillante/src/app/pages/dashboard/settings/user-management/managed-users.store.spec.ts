import { TestBed } from '@angular/core/testing'
import { UserStatus } from '@contracts/user/user.constants'
import { createManagedUserDto } from '@domain/user/managed-user.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { clearAllMocks, fn, type MockFn, spyOn } from '@resetshop/util/test-utils'
import { NEVER, of, throwError } from 'rxjs'
import { ManagedUsersApi } from './managed-users.interface'
import { ManagedUsersStore } from './managed-users.store'

describe('ManagedUsersStore', () => {
	let store: InstanceType<typeof ManagedUsersStore>
	let apiMock: Record<keyof ManagedUsersApi, MockFn>

	/** `onInit` loads the list immediately, so `getAll` must be mocked before calling this. */
	function setupStore(): void {
		TestBed.configureTestingModule({
			providers: [ManagedUsersStore, { provide: ManagedUsersApi, useValue: apiMock }, provideTranslationMock()],
		})
		store = TestBed.inject(ManagedUsersStore)
		TestBed.tick()
	}

	beforeEach(() => {
		clearAllMocks()
		spyOn(console, 'error')

		apiMock = { getAll: fn(), update: fn(), delete: fn() }
		apiMock.getAll.mockReturnValue(of([]))
	})

	describe('initial state', () => {
		it('should start loading immediately via onInit', () => {
			apiMock.getAll.mockReturnValue(NEVER)
			setupStore()

			expect(store.users()).toEqual([])
			expect(store.searchQuery()).toBe('')
			expect(store.isLoadingList()).toBe(true)
			expect(store.isUpdating()).toBe(false)
			expect(store.isDeleting()).toBe(false)
			expect(store.readError()).toEqual({ list: null })
			expect(store.mutationError()).toEqual({ update: null, delete: null })
		})
	})

	describe('loadUsers', () => {
		it('should map the users of the backend to the screen model', () => {
			apiMock.getAll.mockReturnValue(of([createManagedUserDto({ id: 4, firstName: 'Ana', lastName: 'Gomez' })]))
			setupStore()

			expect(store.users()).toHaveLength(1)
			expect(store.users()[0].id).toBe(4)
			expect(store.users()[0].fullName).toBe('Ana Gomez')
			expect(store.users()[0].status).toBe(UserStatus.ACTIVE)
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
			apiMock.getAll.mockReturnValue(of([createManagedUserDto({ id: 9 })]))

			store.reload()

			expect(store.users().map((user) => user.id)).toEqual([9])
		})
	})

	describe('filteredUsers', () => {
		beforeEach(() => {
			apiMock.getAll.mockReturnValue(
				of([
					createManagedUserDto({ id: 1, firstName: 'Ana', lastName: 'Perez', email: 'ana@brillante.test' }),
					createManagedUserDto({ id: 2, firstName: 'Beto', lastName: 'Gomez', email: 'beto@brillante.test' }),
				]),
			)
			setupStore()
		})

		it('should return every user without a query', () => {
			expect(store.filteredUsers()).toHaveLength(2)
		})

		it('should match the name or the email, ignoring case and surrounding spaces', () => {
			store.setSearchQuery('  GOMEZ ')
			expect(store.filteredUsers().map((user) => user.id)).toEqual([2])

			store.setSearchQuery('ana@')
			expect(store.filteredUsers().map((user) => user.id)).toEqual([1])
		})
	})

	describe('updateUser', () => {
		it('should send the changes, then reload the list from the server', () => {
			setupStore()
			apiMock.update.mockReturnValue(of(createManagedUserDto()))
			apiMock.getAll.mockReturnValue(of([createManagedUserDto({ id: 3, status: UserStatus.DISABLED })]))

			store.updateUser({ id: 3, changes: { status: UserStatus.DISABLED } })

			expect(apiMock.update.calls).toEqual([[3, { status: UserStatus.DISABLED }]])
			expect(store.isUpdating()).toBe(false)
			expect(store.users()[0].status).toBe(UserStatus.DISABLED)
		})

		it('should record the update error and keep the list when it fails', () => {
			apiMock.getAll.mockReturnValue(of([createManagedUserDto({ id: 3 })]))
			setupStore()
			apiMock.update.mockReturnValue(throwError(() => new Error('boom')))

			store.updateUser({ id: 3, changes: { firstName: 'Ana' } })

			expect(store.mutationError().update).toBe('MANAGED_USERS.ERRORS.UPDATE')
			expect(store.hasMutationError()).toBe(true)
			expect(store.isUpdating()).toBe(false)
			expect(store.users()).toHaveLength(1)
		})

		it('should be updating while the request is pending', () => {
			setupStore()
			apiMock.update.mockReturnValue(NEVER)

			store.updateUser({ id: 3, changes: { firstName: 'Ana' } })

			expect(store.isUpdating()).toBe(true)
			expect(store.isMutating()).toBe(true)
		})
	})

	describe('deleteUser', () => {
		it('should delete and reload the list', () => {
			apiMock.getAll.mockReturnValue(of([createManagedUserDto({ id: 3 })]))
			setupStore()
			apiMock.delete.mockReturnValue(of(null))
			apiMock.getAll.mockReturnValue(of([]))

			store.deleteUser(3)

			expect(apiMock.delete.calls).toEqual([[3]])
			expect(store.users()).toEqual([])
			expect(store.isDeleting()).toBe(false)
		})

		it('should record the delete error when it fails', () => {
			setupStore()
			apiMock.delete.mockReturnValue(throwError(() => new Error('boom')))

			store.deleteUser(3)

			expect(store.mutationError().delete).toBe('MANAGED_USERS.ERRORS.DELETE')
		})
	})

	describe('errors', () => {
		it('should clear one mutation error, or all errors', () => {
			setupStore()
			apiMock.update.mockReturnValue(throwError(() => new Error('boom')))
			apiMock.delete.mockReturnValue(throwError(() => new Error('boom')))
			store.updateUser({ id: 3, changes: { firstName: 'Ana' } })
			store.deleteUser(3)

			store.clearMutationError('update')
			expect(store.mutationError()).toEqual({ update: null, delete: 'MANAGED_USERS.ERRORS.DELETE' })

			store.clearErrors()
			expect(store.hasMutationError()).toBe(false)
			expect(store.hasReadError()).toBe(false)
		})
	})
})
