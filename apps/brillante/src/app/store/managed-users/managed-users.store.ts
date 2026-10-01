import { computed, inject } from '@angular/core'
import type { CreateUserRequest, UpdateUserRequest } from '@contracts/user/user.types'
import { mapUserDtoToUser } from '@domain/user/user.mapper'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { AppTranslation } from '@providers/i18n/app-translation'
import { UserApi } from '@providers/user/user.interface'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs'
import type { ManagedUsersMutationError, ManagedUsersReadError } from './managed-users.types'
import { initialManagedUsersState } from './managed-users.types'

function patchReadError(
	current: ManagedUsersReadError,
	key: keyof ManagedUsersReadError,
	value: string | null,
): ManagedUsersReadError {
	return { ...current, [key]: value }
}

function patchMutationError(
	current: ManagedUsersMutationError,
	key: keyof ManagedUsersMutationError,
	value: string | null,
): ManagedUsersMutationError {
	return { ...current, [key]: value }
}

/**
 * Users of the system managed from the settings area. The API returns every user at once, so
 * the list is neither paginated nor searched server-side: `filteredUsers` applies the search
 * query in memory.
 */
export const ManagedUsersStore = signalStore(
	{ providedIn: 'root' },
	withState(initialManagedUsersState),
	withComputed((store) => ({
		isAnyLoading: computed(
			() => store.isLoadingList() || store.isCreating() || store.isUpdating() || store.isDeleting(),
		),
		hasReadError: computed(() => Object.values(store.readError()).some((e) => e !== null)),
		hasMutationError: computed(() => Object.values(store.mutationError()).some((e) => e !== null)),
		isMutating: computed(() => store.isCreating() || store.isUpdating() || store.isDeleting()),
		filteredUsers: computed(() => {
			const query = store.searchQuery().trim().toLowerCase()
			if (!query) return store.users()
			return store
				.users()
				.filter((user) =>
					[user.fullName, user.userName, user.email].some((field) => field.toLowerCase().includes(query)),
				)
		}),
	})),
	withMethods((store) => {
		const api = inject(UserApi)
		const loggerService = inject(Logger)
		const translation = inject(AppTranslation)

		return {
			loadUsers: rxMethod<void>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingList: true,
							readError: patchReadError(store.readError(), 'list', null),
						}),
					),
					switchMap(() =>
						api.getAll().pipe(
							tap({
								next: (users) => patchState(store, { users: users.map(mapUserDtoToUser), isLoadingList: false }),
								error: (err) => {
									loggerService.error('ManagedUsersStore', 'loadUsers failed', err)
									patchState(store, {
										isLoadingList: false,
										readError: patchReadError(
											store.readError(),
											'list',
											translation.instant('MANAGED_USERS.ERRORS.LOAD'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			setSearchQuery(query: string): void {
				patchState(store, { searchQuery: query })
			},

			clearMutationError(key: keyof ManagedUsersMutationError): void {
				patchState(store, { mutationError: patchMutationError(store.mutationError(), key, null) })
			},

			clearErrors(): void {
				patchState(store, {
					readError: { list: null },
					mutationError: { create: null, update: null, delete: null },
				})
			},
		}
	}),
	withMethods((store) => {
		const api = inject(UserApi)
		const loggerService = inject(Logger)
		const translation = inject(AppTranslation)

		return {
			reload(): void {
				store.loadUsers()
			},

			createUser: rxMethod<CreateUserRequest>(
				pipe(
					tap(() =>
						patchState(store, {
							isCreating: true,
							mutationError: patchMutationError(store.mutationError(), 'create', null),
						}),
					),
					switchMap((body) =>
						api.register(body).pipe(
							tap({
								next: () => {
									patchState(store, { isCreating: false })
									store.loadUsers()
								},
								error: (err) => {
									loggerService.error('ManagedUsersStore', 'createUser failed', err)
									patchState(store, {
										isCreating: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'create',
											translation.instant('MANAGED_USERS.ERRORS.CREATE'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			updateUser: rxMethod<UpdateUserRequest>(
				pipe(
					tap(() =>
						patchState(store, {
							isUpdating: true,
							mutationError: patchMutationError(store.mutationError(), 'update', null),
						}),
					),
					switchMap((body) =>
						api.update(body).pipe(
							tap({
								next: () => {
									patchState(store, { isUpdating: false })
									store.loadUsers()
								},
								error: (err) => {
									loggerService.error('ManagedUsersStore', 'updateUser failed', err)
									patchState(store, {
										isUpdating: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'update',
											translation.instant('MANAGED_USERS.ERRORS.UPDATE'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			deleteUser: rxMethod<number>(
				pipe(
					tap(() =>
						patchState(store, {
							isDeleting: true,
							mutationError: patchMutationError(store.mutationError(), 'delete', null),
						}),
					),
					switchMap((id) =>
						api.delete(id).pipe(
							tap({
								next: () => {
									patchState(store, { isDeleting: false })
									store.loadUsers()
								},
								error: (err) => {
									loggerService.error('ManagedUsersStore', 'deleteUser failed', err)
									patchState(store, {
										isDeleting: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'delete',
											translation.instant('MANAGED_USERS.ERRORS.DELETE'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),
		}
	}),
	withHooks({
		onInit(store) {
			store.loadUsers()
		},
	}),
)
