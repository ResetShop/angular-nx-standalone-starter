import { computed, inject } from '@angular/core'
import type { UpdateUserRequest } from '@contracts/user/user.types'
import { mapManagedUserDto } from '@domain/user/managed-user.mapper'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { AppTranslation } from '@providers/i18n/app-translation'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs'
import { ManagedUsersApi } from './managed-users.interface'
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

/** A change to one user, as the backend's update endpoint takes it. */
export interface UserChange {
	id: number
	changes: UpdateUserRequest
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
			() => store.isLoadingList() || store.isUpdating() || store.isDeleting() || store.isResettingPassword(),
		),
		hasReadError: computed(() => Object.values(store.readError()).some((e) => e !== null)),
		hasMutationError: computed(() => Object.values(store.mutationError()).some((e) => e !== null)),
		isMutating: computed(() => store.isUpdating() || store.isDeleting() || store.isResettingPassword()),
		filteredUsers: computed(() => {
			const query = store.searchQuery().trim().toLowerCase()
			if (!query) return store.users()
			return store
				.users()
				.filter((user) => [user.fullName, user.email].some((field) => field.toLowerCase().includes(query)))
		}),
	})),
	withMethods((store) => {
		const api = inject(ManagedUsersApi)
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
								next: (users) => patchState(store, { users: users.map(mapManagedUserDto), isLoadingList: false }),
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
					mutationError: { update: null, delete: null, resetPassword: null },
				})
			},
		}
	}),
	withMethods((store) => {
		const api = inject(ManagedUsersApi)
		const loggerService = inject(Logger)
		const translation = inject(AppTranslation)

		return {
			reload(): void {
				store.loadUsers()
			},

			updateUser: rxMethod<UserChange>(
				pipe(
					tap(() =>
						patchState(store, {
							isUpdating: true,
							mutationError: patchMutationError(store.mutationError(), 'update', null),
						}),
					),
					switchMap(({ id, changes }) =>
						api.update(id, changes).pipe(
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

			/** The list does not change, so there is nothing to reload after a reset. */
			resetPassword: rxMethod<number>(
				pipe(
					tap(() =>
						patchState(store, {
							isResettingPassword: true,
							mutationError: patchMutationError(store.mutationError(), 'resetPassword', null),
						}),
					),
					switchMap((id) =>
						api.resetPassword(id).pipe(
							tap({
								next: () => patchState(store, { isResettingPassword: false }),
								error: (err) => {
									loggerService.error('ManagedUsersStore', 'resetPassword failed', err)
									patchState(store, {
										isResettingPassword: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'resetPassword',
											translation.instant('MANAGED_USERS.ERRORS.RESET_PASSWORD'),
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
