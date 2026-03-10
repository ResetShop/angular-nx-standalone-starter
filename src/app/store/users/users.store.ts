import { computed, inject } from '@angular/core';
import type { CreateUserRequest, UpdateUserRequest, UpdateUserStatusRequest } from '@contracts/user/user.types';
import type { IManagedUser } from '@domain/user-management/managed-user.interface';
import { mapManagedUserResponse } from '@domain/user-management/managed-user.mapper';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { UsersApiService } from '@providers/users/users';
import { firstValueFrom } from 'rxjs';
import { initialUsersState } from './users.types';

/**
 * UsersStore - Signal Store for user management state
 *
 * Manages the user list, pagination, search, and CRUD operations.
 * Components inject this store directly for all user management operations.
 * Uses UsersApiService for HTTP calls and mapManagedUserResponse for domain mapping.
 */
export const UsersStore = signalStore(
	{ providedIn: 'root' },
	withState(initialUsersState),
	withComputed((store) => ({
		hasNextPage: computed(() => store.currentPage() < store.totalPages()),
		hasPreviousPage: computed(() => store.currentPage() > 1),
		isAnyLoading: computed(
			() => store.isLoadingList() || store.isCreating() || store.isUpdating() || store.isDeleting(),
		),
	})),
	withMethods((store) => {
		const usersApi = inject(UsersApiService);

		// Named function declaration — referenced by setPage/setPageSize/setSearchQuery/deleteUser
		async function loadUsers(): Promise<void> {
			const offset = (store.currentPage() - 1) * store.pageSize();
			patchState(store, { isLoadingList: true, listError: null });
			try {
				const response = await firstValueFrom(
					usersApi.getAll({
						offset,
						limit: store.pageSize(),
						search: store.searchQuery() || undefined,
					}),
				);
				const users = response.data.map(mapManagedUserResponse);
				const totalPages = Math.ceil(response.total / store.pageSize());
				patchState(store, { users, totalItems: response.total, totalPages, isLoadingList: false });
			} catch {
				patchState(store, { isLoadingList: false, listError: 'Failed to load users' });
			}
		}

		return {
			loadUsers,

			async createUser(body: CreateUserRequest): Promise<void> {
				patchState(store, { isCreating: true, mutationError: null });
				try {
					const response = await firstValueFrom(usersApi.create(body));
					const newUser = mapManagedUserResponse(response);
					const newTotalItems = store.totalItems() + 1;
					patchState(store, {
						users: [newUser, ...store.users()],
						totalItems: newTotalItems,
						totalPages: Math.ceil(newTotalItems / store.pageSize()),
						isCreating: false,
					});
				} catch {
					patchState(store, { isCreating: false, mutationError: 'Failed to create user' });
				}
			},

			async updateUser(id: number, body: UpdateUserRequest): Promise<void> {
				patchState(store, { isUpdating: true, mutationError: null });
				try {
					const response = await firstValueFrom(usersApi.update(id, body));
					const updatedUser = mapManagedUserResponse(response);
					const selectedUpdate = store.selectedUser()?.id === id ? updatedUser : store.selectedUser();
					patchState(store, {
						users: store.users().map((u) => (u.id === id ? updatedUser : u)),
						selectedUser: selectedUpdate,
						isUpdating: false,
					});
				} catch {
					patchState(store, { isUpdating: false, mutationError: 'Failed to update user' });
				}
			},

			async deleteUser(id: number): Promise<void> {
				patchState(store, { isDeleting: true, mutationError: null });
				try {
					await firstValueFrom(usersApi.delete(id));
					const remaining = store.users().filter((u) => u.id !== id);
					const newTotalItems = store.totalItems() - 1;
					const selectedUpdate = store.selectedUser()?.id === id ? null : store.selectedUser();
					patchState(store, {
						users: remaining,
						totalItems: newTotalItems,
						totalPages: Math.ceil(newTotalItems / store.pageSize()),
						selectedUser: selectedUpdate,
						isDeleting: false,
					});

					if (remaining.length === 0 && store.currentPage() > 1) {
						patchState(store, { currentPage: store.currentPage() - 1 });
						void loadUsers();
					}
				} catch {
					patchState(store, { isDeleting: false, mutationError: 'Failed to delete user' });
				}
			},

			async updateUserStatus(id: number, body: UpdateUserStatusRequest): Promise<void> {
				patchState(store, { isUpdating: true, mutationError: null });
				try {
					const response = await firstValueFrom(usersApi.updateStatus(id, body));
					const updatedUser = mapManagedUserResponse(response);
					const selectedUpdate = store.selectedUser()?.id === id ? updatedUser : store.selectedUser();
					patchState(store, {
						users: store.users().map((u) => (u.id === id ? updatedUser : u)),
						selectedUser: selectedUpdate,
						isUpdating: false,
					});
				} catch {
					patchState(store, { isUpdating: false, mutationError: 'Failed to update user status' });
				}
			},

			setPage(page: number): void {
				patchState(store, { currentPage: page });
				void loadUsers();
			},

			setPageSize(size: number): void {
				patchState(store, { pageSize: size, currentPage: 1 });
				void loadUsers();
			},

			setSearchQuery(query: string): void {
				patchState(store, { searchQuery: query, currentPage: 1 });
				void loadUsers();
			},

			selectUser(user: IManagedUser | null): void {
				patchState(store, { selectedUser: user });
			},

			clearErrors(): void {
				patchState(store, { listError: null, mutationError: null });
			},
		};
	}),
);
