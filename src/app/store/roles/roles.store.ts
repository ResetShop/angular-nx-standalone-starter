import { computed, inject } from '@angular/core';
import type { AssignPermissionsRequest, CreateRoleRequest, UpdateRoleRequest } from '@contracts/role/role.types';
import type { IRole } from '@domain/access/role.interface';
import { mapRole } from '@domain/access/role.mapper';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { RolesApiService } from '@providers/roles/roles';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { initialRolesState } from './roles.types';

/**
 * RolesStore - Signal Store for role management state
 *
 * Manages the role list, pagination, search, CRUD operations, and permission assignment.
 * Components inject this store directly for all role management operations.
 * Uses RolesApiService for HTTP calls and mapRole for domain mapping.
 *
 * The list load is reactive: changing currentPage, pageSize, or searchQuery
 * automatically triggers a re-fetch via rxMethod watching the computed listParams signal.
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
		/** Reactive params for list fetch — any change triggers loadRoles via rxMethod */
		listParams: computed(() => ({
			offset: (store.currentPage() - 1) * store.pageSize(),
			limit: store.pageSize(),
			search: store.searchQuery() || undefined,
		})),
	})),
	withMethods((store) => {
		const rolesApi = inject(RolesApiService);

		return {
			loadRoles: rxMethod<{ offset: number; limit: number; search?: string }>(
				pipe(
					tap(() => patchState(store, { isLoadingList: true, readError: null })),
					switchMap(({ offset, limit, search }) =>
						rolesApi.getAll({ offset, limit, search }).pipe(
							tap({
								next: (response) => {
									const totalPages = Math.ceil(response.total / store.pageSize());
									patchState(store, {
										roles: response.data,
										totalItems: response.total,
										totalPages,
										isLoadingList: false,
									});
								},
								error: () => patchState(store, { isLoadingList: false, readError: 'Failed to load roles' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			loadRole: rxMethod<number>(
				pipe(
					tap(() => patchState(store, { isLoadingDetail: true, readError: null })),
					switchMap((id) =>
						rolesApi.getByIdWithPermissions(id).pipe(
							tap({
								next: (response) => patchState(store, { selectedRole: mapRole(response), isLoadingDetail: false }),
								error: () => patchState(store, { isLoadingDetail: false, readError: 'Failed to load role' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			loadAllRoles: rxMethod<void>(
				pipe(
					tap(() => patchState(store, { isLoadingAll: true, readError: null })),
					switchMap(() =>
						rolesApi.getAllUnpaginated().pipe(
							tap({
								next: (roles) => patchState(store, { allRoles: roles, isLoadingAll: false }),
								error: () => patchState(store, { isLoadingAll: false, readError: 'Failed to load roles' }),
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

			selectRole(role: IRole | null): void {
				patchState(store, { selectedRole: role });
			},

			clearErrors(): void {
				patchState(store, { readError: null, mutationError: null });
			},
		};
	}),
	// Mutation methods that reload after success, plus explicit reload for external use
	withMethods((store) => {
		const rolesApi = inject(RolesApiService);

		return {
			reload(): void {
				store.loadRoles(store.listParams());
			},

			/** If the updated role is currently selected, triggers a background loadRole to refresh permissions. */
			updateRole: rxMethod<{ id: number; body: UpdateRoleRequest }>(
				pipe(
					tap(() => patchState(store, { isUpdating: true, mutationError: null })),
					switchMap(({ id, body }) =>
						rolesApi.update(id, body).pipe(
							tap({
								next: (updatedRole) => {
									patchState(store, {
										roles: store.roles().map((r) => (r.id === id ? updatedRole : r)),
										isUpdating: false,
									});
									if (store.selectedRole()?.id === id) {
										store.loadRole(id);
									}
								},
								error: () => patchState(store, { isUpdating: false, mutationError: 'Failed to update role' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			createRole: rxMethod<CreateRoleRequest>(
				pipe(
					tap(() => patchState(store, { isCreating: true, mutationError: null })),
					switchMap((body) =>
						rolesApi.create(body).pipe(
							tap({
								next: () => {
									patchState(store, { isCreating: false });
									store.loadRoles(store.listParams());
								},
								error: () => patchState(store, { isCreating: false, mutationError: 'Failed to create role' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			deleteRole: rxMethod<number>(
				pipe(
					tap(() => patchState(store, { isDeleting: true, mutationError: null })),
					switchMap((id) =>
						rolesApi.delete(id).pipe(
							tap({
								next: () => {
									if (store.selectedRole()?.id === id) {
										patchState(store, { selectedRole: null });
									}
									patchState(store, {
										allRoles: store.allRoles().filter((r) => r.id !== id),
										isDeleting: false,
									});

									// When the last item on a page is deleted, navigate to previous page.
									// Patching currentPage triggers the reactive loadRoles chain automatically.
									if (store.roles().length === 1 && store.currentPage() > 1) {
										patchState(store, { currentPage: store.currentPage() - 1 });
									} else {
										store.loadRoles(store.listParams());
									}
								},
								error: () => patchState(store, { isDeleting: false, mutationError: 'Failed to delete role' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			/** After assignment, triggers a background loadRole to refresh selectedRole permissions. */
			assignPermissions: rxMethod<{ id: number; body: AssignPermissionsRequest }>(
				pipe(
					tap(() => patchState(store, { isAssigningPermissions: true, mutationError: null })),
					switchMap(({ id, body }) =>
						rolesApi.assignPermissions(id, body).pipe(
							tap({
								next: () => {
									patchState(store, { isAssigningPermissions: false });
									store.loadRole(id);
								},
								error: () =>
									patchState(store, {
										isAssigningPermissions: false,
										mutationError: 'Failed to assign permissions',
									}),
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
			store.loadRoles(store.listParams);
		},
	}),
);
