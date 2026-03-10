import { computed, inject } from '@angular/core';
import type { AssignPermissionsRequest, CreateRoleRequest, UpdateRoleRequest } from '@contracts/role/role.types';
import type { IRole } from '@domain/access/role.interface';
import { mapRole } from '@domain/access/role.mapper';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { RolesApiService } from '@providers/roles/roles';
import { firstValueFrom } from 'rxjs';
import { initialRolesState } from './roles.types';

/**
 * RolesStore - Signal Store for role management state
 *
 * Manages the role list, pagination, search, CRUD operations, and permission assignment.
 * Components inject this store directly for all role management operations.
 * Uses RolesApiService for HTTP calls and mapRole for domain mapping.
 */
export const RolesStore = signalStore(
	{ providedIn: 'root' },
	withState(initialRolesState),
	withComputed((store) => ({
		hasNextPage: computed(() => store.currentPage() < store.totalPages()),
		hasPreviousPage: computed(() => store.currentPage() > 1),
		isAnyLoading: computed(
			() =>
				store.isLoadingList() ||
				store.isLoadingAll() ||
				store.isLoadingDetail() ||
				store.isCreating() ||
				store.isUpdating() ||
				store.isDeleting() ||
				store.isAssigningPermissions(),
		),
	})),
	withMethods((store) => {
		const rolesApi = inject(RolesApiService);

		// Named function declaration — referenced by setPage/setPageSize/setSearchQuery/deleteRole
		async function loadRoles(): Promise<void> {
			const offset = (store.currentPage() - 1) * store.pageSize();
			patchState(store, { isLoadingList: true, readError: null });
			try {
				const response = await firstValueFrom(
					rolesApi.getAll({
						offset,
						limit: store.pageSize(),
						search: store.searchQuery() || undefined,
					}),
				);
				const totalPages = Math.ceil(response.total / store.pageSize());
				patchState(store, {
					roles: response.data,
					totalItems: response.total,
					totalPages,
					isLoadingList: false,
				});
			} catch {
				patchState(store, { isLoadingList: false, readError: 'Failed to load roles' });
			}
		}

		async function loadRole(id: number): Promise<void> {
			patchState(store, { isLoadingDetail: true, readError: null });
			try {
				const response = await firstValueFrom(rolesApi.getByIdWithPermissions(id));
				patchState(store, { selectedRole: mapRole(response), isLoadingDetail: false });
			} catch {
				patchState(store, { isLoadingDetail: false, readError: 'Failed to load role' });
			}
		}

		return {
			loadRoles,
			loadRole,

			async loadAllRoles(): Promise<void> {
				patchState(store, { isLoadingAll: true, readError: null });
				try {
					const roles = await firstValueFrom(rolesApi.getAllUnpaginated());
					patchState(store, { allRoles: roles, isLoadingAll: false });
				} catch {
					patchState(store, { isLoadingAll: false, readError: 'Failed to load roles' });
				}
			},

			async createRole(body: CreateRoleRequest): Promise<void> {
				patchState(store, { isCreating: true, mutationError: null });
				try {
					const newRole = await firstValueFrom(rolesApi.create(body));
					const newTotalItems = store.totalItems() + 1;
					patchState(store, {
						roles: [newRole, ...store.roles()],
						totalItems: newTotalItems,
						totalPages: Math.ceil(newTotalItems / store.pageSize()),
						isCreating: false,
					});
				} catch {
					patchState(store, { isCreating: false, mutationError: 'Failed to create role' });
				}
			},

			/** If the updated role is currently selected, triggers a background `loadRole(id)` to refresh permissions. Reload failures land in `readError`. */
			async updateRole(id: number, body: UpdateRoleRequest): Promise<void> {
				patchState(store, { isUpdating: true, mutationError: null });
				try {
					const updatedRole = await firstValueFrom(rolesApi.update(id, body));
					patchState(store, {
						roles: store.roles().map((r) => (r.id === id ? updatedRole : r)),
						isUpdating: false,
					});
					if (store.selectedRole()?.id === id) {
						void loadRole(id);
					}
				} catch {
					patchState(store, { isUpdating: false, mutationError: 'Failed to update role' });
				}
			},

			async deleteRole(id: number): Promise<void> {
				patchState(store, { isDeleting: true, mutationError: null });
				try {
					await firstValueFrom(rolesApi.delete(id));
					const remaining = store.roles().filter((r) => r.id !== id);
					const newTotalItems = store.totalItems() - 1;
					const selectedUpdate = store.selectedRole()?.id === id ? null : store.selectedRole();
					patchState(store, {
						roles: remaining,
						allRoles: store.allRoles().filter((r) => r.id !== id),
						totalItems: newTotalItems,
						totalPages: Math.ceil(newTotalItems / store.pageSize()),
						selectedRole: selectedUpdate,
						isDeleting: false,
					});

					if (remaining.length === 0 && store.currentPage() > 1) {
						patchState(store, { currentPage: store.currentPage() - 1 });
						void loadRoles();
					}
				} catch {
					patchState(store, { isDeleting: false, mutationError: 'Failed to delete role' });
				}
			},

			/** After assignment, triggers a background `loadRole(id)` to refresh `selectedRole` permissions. Reload failures land in `readError`. */
			async assignPermissions(id: number, body: AssignPermissionsRequest): Promise<void> {
				patchState(store, { isAssigningPermissions: true, mutationError: null });
				try {
					await firstValueFrom(rolesApi.assignPermissions(id, body));
					patchState(store, { isAssigningPermissions: false });
					void loadRole(id);
				} catch {
					patchState(store, {
						isAssigningPermissions: false,
						mutationError: 'Failed to assign permissions',
					});
				}
			},

			setPage(page: number): void {
				patchState(store, { currentPage: page });
				void loadRoles();
			},

			setPageSize(size: number): void {
				patchState(store, { pageSize: size, currentPage: 1 });
				void loadRoles();
			},

			setSearchQuery(query: string): void {
				patchState(store, { searchQuery: query, currentPage: 1 });
				void loadRoles();
			},

			selectRole(role: IRole | null): void {
				patchState(store, { selectedRole: role });
			},

			clearErrors(): void {
				patchState(store, { readError: null, mutationError: null });
			},
		};
	}),
);
