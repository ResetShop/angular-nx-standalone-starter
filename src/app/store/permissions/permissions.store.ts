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
