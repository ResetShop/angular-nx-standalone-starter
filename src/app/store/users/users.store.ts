import { computed, inject } from '@angular/core';
import type { SearchPaginationParams } from '@contracts/common/pagination.types';
import type { CreateUserRequest, UpdateUserRequest, UpdateUserStatusRequest } from '@contracts/user/user.types';
import type { IManagedUser } from '@domain/user-management/managed-user.interface';
import { mapManagedUserResponse } from '@domain/user-management/managed-user.mapper';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { UsersApiService } from '@providers/users/users';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { initialUsersState } from './users.types';

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
			() => store.isLoadingList() || store.isCreating() || store.isUpdating() || store.isDeleting(),
		),
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
		const usersApi = inject(UsersApiService);

		return {
			loadUsers: rxMethod<SearchPaginationParams>(
				pipe(
					tap(() => patchState(store, { isLoadingList: true, listError: null })),
					switchMap(({ offset, limit, search }) =>
						usersApi.getAll({ offset, limit, search }).pipe(
							tap({
								next: (response) => {
									const users = response.data.map(mapManagedUserResponse);
									patchState(store, { users, totalItems: response.total, isLoadingList: false });
								},
								error: () => patchState(store, { isLoadingList: false, listError: 'Failed to load users' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			updateUser: rxMethod<{ id: number; body: UpdateUserRequest }>(
				pipe(
					tap(() => patchState(store, { isUpdating: true, mutationError: null })),
					switchMap(({ id, body }) =>
						usersApi.update(id, body).pipe(
							tap({
								next: (response) => {
									const updatedUser = mapManagedUserResponse(response);
									const selectedUpdate = store.selectedUser()?.id === id ? updatedUser : store.selectedUser();
									patchState(store, {
										users: store.users().map((u) => (u.id === id ? updatedUser : u)),
										selectedUser: selectedUpdate,
										isUpdating: false,
									});
								},
								error: () => patchState(store, { isUpdating: false, mutationError: 'Failed to update user' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			updateUserStatus: rxMethod<{ id: number; body: UpdateUserStatusRequest }>(
				pipe(
					tap(() => patchState(store, { isUpdating: true, mutationError: null })),
					switchMap(({ id, body }) =>
						usersApi.updateStatus(id, body).pipe(
							tap({
								next: (response) => {
									const updatedUser = mapManagedUserResponse(response);
									const selectedUpdate = store.selectedUser()?.id === id ? updatedUser : store.selectedUser();
									patchState(store, {
										users: store.users().map((u) => (u.id === id ? updatedUser : u)),
										selectedUser: selectedUpdate,
										isUpdating: false,
									});
								},
								error: () => patchState(store, { isUpdating: false, mutationError: 'Failed to update user status' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			setPage(page: number): void {
				patchState(store, { currentPage: page });
			},

			setPageSize(size: number): void {
				patchState(store, { pageSize: size, currentPage: 1 });
			},

			setSearchQuery(query: string): void {
				patchState(store, { searchQuery: query, currentPage: 1 });
			},

			selectUser(user: IManagedUser | null): void {
				patchState(store, { selectedUser: user });
			},

			clearErrors(): void {
				patchState(store, { listError: null, mutationError: null });
			},
		};
	}),
	// Mutation methods that reload the list after success, plus explicit reload for external use
	withMethods((store) => {
		const usersApi = inject(UsersApiService);

		return {
			reload(): void {
				store.loadUsers(store.listParams());
			},

			createUser: rxMethod<CreateUserRequest>(
				pipe(
					tap(() => patchState(store, { isCreating: true, mutationError: null })),
					switchMap((body) =>
						usersApi.create(body).pipe(
							tap({
								next: () => {
									patchState(store, { isCreating: false });
									store.loadUsers(store.listParams());
								},
								error: () => patchState(store, { isCreating: false, mutationError: 'Failed to create user' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			deleteUser: rxMethod<number>(
				pipe(
					tap(() => patchState(store, { isDeleting: true, mutationError: null })),
					switchMap((id) =>
						usersApi.delete(id).pipe(
							tap({
								next: () => {
									if (store.selectedUser()?.id === id) {
										patchState(store, { selectedUser: null });
									}
									patchState(store, { isDeleting: false });

									// When the last item on a page is deleted, navigate to previous page.
									// Patching currentPage triggers the reactive loadUsers chain automatically.
									if (store.users().length === 1 && store.currentPage() > 1) {
										patchState(store, { currentPage: store.currentPage() - 1 });
									} else {
										store.loadUsers(store.listParams());
									}
								},
								error: () => patchState(store, { isDeleting: false, mutationError: 'Failed to delete user' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),
		};
	}),
	withHooks({
		onInit(store) {
			// Pass the computed listParams signal — rxMethod watches it and re-fires on any change
			store.loadUsers(store.listParams);
		},
	}),
);
