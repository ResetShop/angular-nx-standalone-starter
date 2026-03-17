import { HttpErrorResponse } from '@angular/common/http'
import { computed, inject } from '@angular/core'
import type { SearchPaginationParams } from '@contracts/common/pagination.types'
import type { CreateUserRequest, UpdateUserRequest, UpdateUserStatusRequest } from '@contracts/user/user.types'
import type { IManagedUser } from '@domain/user-management/managed-user.interface'
import { mapManagedUserResponse } from '@domain/user-management/managed-user.mapper'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { UsersApiService } from '@providers/users/users'
import { parseDurationToMs } from '@utils/duration'
import { catchError, debounceTime, EMPTY, pipe, switchMap, tap } from 'rxjs'
import type { UsersMutationError, UsersReadError } from './users.types'
import { initialUsersState } from './users.types'

function patchReadError(current: UsersReadError, key: keyof UsersReadError, value: string | null): UsersReadError {
	return { ...current, [key]: value }
}

function patchMutationError(
	current: UsersMutationError,
	key: keyof UsersMutationError,
	value: string | null,
): UsersMutationError {
	return { ...current, [key]: value }
}

function extractErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof HttpErrorResponse && typeof err.error?.error === 'string') {
		return err.error.error
	}
	return fallback
}

/**
 * UsersStore - Signal Store for user management state
 *
 * Manages the user list, pagination, search, and CRUD operations.
 * Components inject this store directly for all user management operations.
 * Uses UsersApiService for HTTP calls and mapManagedUserResponse for domain mapping.
 *
 * The list load is reactive: changing currentPage, pageSize, or searchQuery
 * automatically triggers a re-fetch via rxMethod watching the computed listParams signal.
 */
export const UsersStore = signalStore(
	{ providedIn: 'root' },
	withState(initialUsersState),
	withComputed((store) => ({
		totalPages: computed(() => (store.totalItems() === 0 ? 0 : Math.ceil(store.totalItems() / store.pageSize()))),
		isAnyLoading: computed(
			() =>
				store.isLoadingList() ||
				store.isLoadingDetail() ||
				store.isCreating() ||
				store.isUpdating() ||
				store.isDeleting(),
		),
		hasReadError: computed(() => Object.values(store.readError()).some((e) => e !== null)),
		hasMutationError: computed(() => Object.values(store.mutationError()).some((e) => e !== null)),
		isMutating: computed(() => store.isCreating() || store.isUpdating() || store.isDeleting()),
		/** Reactive params for list fetch — any change triggers loadUsers via rxMethod */
		listParams: computed(() => ({
			offset: (store.currentPage() - 1) * store.pageSize(),
			limit: store.pageSize(),
			search: store.searchQuery() || undefined,
		})),
	})),
	withComputed((store) => ({
		hasNextPage: computed(() => store.currentPage() < store.totalPages()),
		hasPreviousPage: computed(() => store.currentPage() > 1),
	})),
	withMethods((store) => {
		const usersApi = inject(UsersApiService)

		return {
			loadUsers: rxMethod<SearchPaginationParams>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingList: true,
							readError: patchReadError(store.readError(), 'list', null),
						}),
					),
					switchMap(({ offset, limit, search }) =>
						usersApi.getAll({ offset, limit, search }).pipe(
							tap({
								next: (response) => {
									const users = response.data.map(mapManagedUserResponse)
									patchState(store, { users, totalItems: response.total, isLoadingList: false })
								},
								// TODO(#66): Replace with structured logging service
								error: (err) => {
									console.error('[UsersStore] loadUsers failed:', err)
									patchState(store, {
										isLoadingList: false,
										readError: patchReadError(store.readError(), 'list', 'Failed to load users'),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			setPage(page: number): void {
				patchState(store, { currentPage: page })
			},

			setPageSize(size: number): void {
				patchState(store, { pageSize: size, currentPage: 1 })
			},

			setSearchQuery: rxMethod<string>(
				pipe(
					debounceTime(parseDurationToMs('300ms')),
					tap((query: string) => patchState(store, { searchQuery: query, currentPage: 1 })),
				),
			),

			loadUser: rxMethod<number>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingDetail: true,
							readError: patchReadError(store.readError(), 'detail', null),
						}),
					),
					switchMap((id) =>
						usersApi.getById(id).pipe(
							tap({
								next: (response) =>
									patchState(store, {
										selectedUser: mapManagedUserResponse(response),
										isLoadingDetail: false,
									}),
								// TODO(#66): Replace with structured logging service
								error: (err) => {
									console.error('[UsersStore] loadUser failed:', err)
									patchState(store, {
										isLoadingDetail: false,
										readError: patchReadError(store.readError(), 'detail', 'Failed to load user'),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			selectUser(user: IManagedUser | null): void {
				patchState(store, { selectedUser: user })
			},

			clearMutationError(key: keyof UsersMutationError): void {
				patchState(store, { mutationError: patchMutationError(store.mutationError(), key, null) })
			},

			clearErrors(): void {
				patchState(store, {
					readError: { list: null, detail: null },
					mutationError: { create: null, update: null, updateStatus: null, delete: null },
				})
			},
		}
	}),
	// Mutation methods — all reload the list after success
	withMethods((store) => {
		const usersApi = inject(UsersApiService)

		return {
			reload(): void {
				store.loadUsers(store.listParams())
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
						usersApi.create(body).pipe(
							tap({
								next: () => {
									patchState(store, { isCreating: false })
									store.loadUsers(store.listParams())
								},
								// TODO(#66): Replace with structured logging service
								error: (err) => {
									console.error('[UsersStore] createUser failed:', err)
									patchState(store, {
										isCreating: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'create',
											extractErrorMessage(err, 'Failed to create user'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			updateUser: rxMethod<{ id: number; body: UpdateUserRequest }>(
				pipe(
					tap(() =>
						patchState(store, {
							isUpdating: true,
							mutationError: patchMutationError(store.mutationError(), 'update', null),
						}),
					),
					switchMap(({ id, body }) =>
						usersApi.update(id, body).pipe(
							tap({
								next: () => {
									patchState(store, { isUpdating: false })
									store.loadUsers(store.listParams())
								},
								// TODO(#66): Replace with structured logging service
								error: (err) => {
									console.error('[UsersStore] updateUser failed:', err)
									patchState(store, {
										isUpdating: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'update',
											extractErrorMessage(err, 'Failed to update user'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			updateUserStatus: rxMethod<{ id: number; body: UpdateUserStatusRequest }>(
				pipe(
					tap(() =>
						patchState(store, {
							isUpdating: true,
							mutationError: patchMutationError(store.mutationError(), 'updateStatus', null),
						}),
					),
					switchMap(({ id, body }) =>
						usersApi.updateStatus(id, body).pipe(
							tap({
								next: () => {
									patchState(store, { isUpdating: false })
									store.loadUsers(store.listParams())
								},
								// TODO(#66): Replace with structured logging service
								error: (err) => {
									console.error('[UsersStore] updateUserStatus failed:', err)
									patchState(store, {
										isUpdating: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'updateStatus',
											extractErrorMessage(err, 'Failed to update user status'),
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
						usersApi.delete(id).pipe(
							tap({
								next: () => {
									if (store.selectedUser()?.id === id) {
										patchState(store, { selectedUser: null })
									}
									patchState(store, { isDeleting: false })

									// When the last item on a page is deleted, navigate to previous page.
									// Patching currentPage triggers the reactive loadUsers chain automatically.
									if (store.users().length === 1 && store.currentPage() > 1) {
										patchState(store, { currentPage: store.currentPage() - 1 })
									} else {
										store.loadUsers(store.listParams())
									}
								},
								// TODO(#66): Replace with structured logging service
								error: (err) => {
									console.error('[UsersStore] deleteUser failed:', err)
									patchState(store, {
										isDeleting: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'delete',
											extractErrorMessage(err, 'Failed to delete user'),
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
			// Pass the computed listParams signal — rxMethod watches it and re-fires on any change
			store.loadUsers(store.listParams)
		},
	}),
)
