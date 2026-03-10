import { computed, inject } from '@angular/core';
import type { PermissionData } from '@contracts/role/role.types';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { PermissionsApiService } from '@providers/permissions/permissions';
import { firstValueFrom } from 'rxjs';
import { initialPermissionsState } from './permissions.types';

/**
 * PermissionsStore - Signal Store for system permissions
 *
 * Read-only store for displaying system-defined permissions.
 * Supports caching (skip re-fetch after first load) and grouping by resource.
 */
export const PermissionsStore = signalStore(
	{ providedIn: 'root' },
	withState(initialPermissionsState),
	withComputed((store) => ({
		permissionsGroupedByResource: computed(() => {
			return store.permissions().reduce((map, permission) => {
				const existing = map.get(permission.resource) ?? [];
				map.set(permission.resource, [...existing, permission]);
				return map;
			}, new Map<string, PermissionData[]>());
		}),
		permissionsGroupedArray: computed(() => {
			const grouped = store.permissions().reduce((map, permission) => {
				const existing = map.get(permission.resource) ?? [];
				map.set(permission.resource, [...existing, permission]);
				return map;
			}, new Map<string, PermissionData[]>());
			return Array.from(grouped.entries()).map(([resource, permissions]) => ({ resource, permissions }));
		}),
	})),
	withMethods((store) => {
		const permissionsApi = inject(PermissionsApiService);

		async function loadPermissions(): Promise<void> {
			if (store.isCached()) return;
			patchState(store, { isLoading: true, error: null });
			try {
				const permissions = await firstValueFrom(permissionsApi.getAllUnpaginated());
				patchState(store, { permissions, isLoading: false, isCached: true });
			} catch {
				patchState(store, { isLoading: false, error: 'Failed to load permissions' });
			}
		}

		return {
			loadPermissions,

			async refresh(): Promise<void> {
				patchState(store, { isCached: false });
				await loadPermissions();
			},

			clearError(): void {
				patchState(store, { error: null });
			},
		};
	}),
);
