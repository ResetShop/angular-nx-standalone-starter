import { computed, inject } from '@angular/core';
import type { PermissionData } from '@contracts/role/role.types';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { PermissionsApiService } from '@providers/permissions/permissions';
import { catchError, EMPTY, filter, pipe, switchMap, tap } from 'rxjs';
import { initialPermissionsState } from './permissions.types';

/**
 * PermissionsStore - Signal Store for system permissions
 *
 * Read-only store for displaying system-defined permissions.
 * Supports caching (skip re-fetch after first load) and grouping by resource.
 * Uses rxMethod for reactive data fetching — onInit triggers the first load automatically.
 */
export const PermissionsStore = signalStore(
	{ providedIn: 'root' },
	withState(initialPermissionsState),
	withComputed((store) => ({
		permissionsGroupedByResource: computed(() => {
			return store.permissions().reduce((grouped, permission) => {
				const existing = grouped.get(permission.resource) ?? [];
				grouped.set(permission.resource, [...existing, permission]);
				return grouped;
			}, new Map<string, PermissionData[]>());
		}),
	})),
	// Second block — derives from permissionsGroupedByResource, which is only available after the first withComputed
	withComputed((store) => ({
		permissionsGroupedArray: computed(() => {
			return Array.from(store.permissionsGroupedByResource().entries()).map(([resource, permissions]) => ({
				resource,
				permissions,
			}));
		}),
	})),
	withMethods((store) => {
		const permissionsApi = inject(PermissionsApiService);

		return {
			loadPermissions: rxMethod<void>(
				pipe(
					filter(() => !store.isCached()),
					tap(() => patchState(store, { isLoading: true, error: null })),
					switchMap(() =>
						permissionsApi.getAllUnpaginated().pipe(
							tap({
								next: (permissions) => patchState(store, { permissions, isLoading: false, isCached: true }),
								error: () => patchState(store, { isLoading: false, error: 'Failed to load permissions' }),
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			clearError(): void {
				patchState(store, { error: null });
			},
		};
	}),
	// Second withMethods block — needs access to store.loadPermissions from the first block
	withMethods((store) => ({
		refresh(): void {
			patchState(store, { isCached: false });
			store.loadPermissions();
		},
	})),
	withHooks({
		onInit(store) {
			// Imperative — no reactive params; cache guard in the filter() operator prevents redundant fetches
			store.loadPermissions();
		},
	}),
);
