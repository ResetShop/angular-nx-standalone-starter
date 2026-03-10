import { TestBed } from '@angular/core/testing';
import type { PermissionData } from '@contracts/role/role.types';
import { PermissionsApiService } from '@providers/permissions/permissions';
import { clearAllMocks, fn, type MockFn } from '@test-utils';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import { PermissionsStore } from './permissions.store';

function createMockPermissionData(overrides: Partial<PermissionData> = {}): PermissionData {
	return {
		id: 1,
		name: 'Read Users',
		description: null,
		resource: 'users',
		action: 'read',
		...overrides,
	};
}

describe('PermissionsStore', () => {
	let store: InstanceType<typeof PermissionsStore>;
	let permissionsApiMock: {
		getAll: MockFn<[], Observable<unknown>>;
		getAllUnpaginated: MockFn<[], Observable<PermissionData[]>>;
	};

	beforeEach(() => {
		clearAllMocks();

		permissionsApiMock = {
			getAll: fn(),
			getAllUnpaginated: fn(),
		};

		TestBed.configureTestingModule({
			providers: [PermissionsStore, { provide: PermissionsApiService, useValue: permissionsApiMock }],
		});

		store = TestBed.inject(PermissionsStore);
	});

	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(store.permissions()).toEqual([]);
			expect(store.isLoading()).toBe(false);
			expect(store.isCached()).toBe(false);
			expect(store.error()).toBeNull();
		});

		it('should have correct computed signals', () => {
			expect(store.permissionsGroupedByResource()).toEqual(new Map());
			expect(store.permissionsGroupedArray()).toEqual([]);
		});
	});

	describe('loadPermissions', () => {
		it('should load permissions and update state on success', async () => {
			const permissions = [
				createMockPermissionData({ id: 1, resource: 'users', action: 'read' }),
				createMockPermissionData({ id: 2, resource: 'users', action: 'write', name: 'Write Users' }),
			];
			permissionsApiMock.getAllUnpaginated.mockReturnValue(of(permissions));

			await store.loadPermissions();

			expect(store.permissions()).toHaveLength(2);
			expect(store.isCached()).toBe(true);
			expect(store.isLoading()).toBe(false);
			expect(store.error()).toBeNull();
		});

		it('should set isLoading during load', () => {
			permissionsApiMock.getAllUnpaginated.mockReturnValue(NEVER);

			void store.loadPermissions();

			expect(store.isLoading()).toBe(true);
		});

		it('should set error on failure', async () => {
			permissionsApiMock.getAllUnpaginated.mockReturnValue(throwError(() => new Error('Network error')));

			await store.loadPermissions();

			expect(store.isLoading()).toBe(false);
			expect(store.error()).toBe('Failed to load permissions');
			expect(store.isCached()).toBe(false);
		});

		it('should skip API call when already cached', async () => {
			permissionsApiMock.getAllUnpaginated.mockReturnValue(of([createMockPermissionData()]));
			await store.loadPermissions();
			expect(store.isCached()).toBe(true);

			const callsBefore = permissionsApiMock.getAllUnpaginated.calls.length;
			await store.loadPermissions();

			expect(permissionsApiMock.getAllUnpaginated.calls).toHaveLength(callsBefore);
		});

		it('should clear error on successful retry', async () => {
			permissionsApiMock.getAllUnpaginated.mockReturnValue(throwError(() => new Error('Error')));
			await store.loadPermissions();
			expect(store.error()).toBe('Failed to load permissions');

			// Retry succeeds
			permissionsApiMock.getAllUnpaginated.mockReturnValue(of([createMockPermissionData()]));
			await store.loadPermissions();

			expect(store.error()).toBeNull();
			expect(store.isCached()).toBe(true);
		});
	});

	describe('refresh', () => {
		it('should force re-fetch when already cached', async () => {
			permissionsApiMock.getAllUnpaginated.mockReturnValue(of([createMockPermissionData()]));
			await store.loadPermissions();

			const callsBefore = permissionsApiMock.getAllUnpaginated.calls.length;
			permissionsApiMock.getAllUnpaginated.mockReturnValue(
				of([createMockPermissionData(), createMockPermissionData({ id: 2, name: 'Write Users', action: 'write' })]),
			);

			await store.refresh();

			expect(permissionsApiMock.getAllUnpaginated.calls.length).toBeGreaterThan(callsBefore);
			expect(store.permissions()).toHaveLength(2);
			expect(store.isCached()).toBe(true);
		});

		it('should set isCached true after successful refresh', async () => {
			permissionsApiMock.getAllUnpaginated.mockReturnValue(of([createMockPermissionData()]));

			await store.refresh();

			expect(store.isCached()).toBe(true);
		});
	});

	describe('computed signals', () => {
		it('should group permissions by resource', async () => {
			const permissions = [
				createMockPermissionData({ id: 1, resource: 'users', action: 'read' }),
				createMockPermissionData({ id: 2, resource: 'users', action: 'write', name: 'Write Users' }),
				createMockPermissionData({ id: 3, resource: 'roles', action: 'read', name: 'Read Roles' }),
			];
			permissionsApiMock.getAllUnpaginated.mockReturnValue(of(permissions));

			await store.loadPermissions();

			const grouped = store.permissionsGroupedByResource();
			expect(grouped.size).toBe(2);
			expect(grouped.get('users')).toHaveLength(2);
			expect(grouped.get('roles')).toHaveLength(1);
		});

		it('should produce correct grouped array for templates', async () => {
			const permissions = [
				createMockPermissionData({ id: 1, resource: 'users', action: 'read' }),
				createMockPermissionData({ id: 2, resource: 'roles', action: 'read', name: 'Read Roles' }),
				createMockPermissionData({ id: 3, resource: 'users', action: 'write', name: 'Write Users' }),
			];
			permissionsApiMock.getAllUnpaginated.mockReturnValue(of(permissions));

			await store.loadPermissions();

			const groupedArray = store.permissionsGroupedArray();
			expect(groupedArray).toHaveLength(2);
			expect(groupedArray[0].resource).toBe('users');
			expect(groupedArray[0].permissions).toHaveLength(2);
			expect(groupedArray[1].resource).toBe('roles');
			expect(groupedArray[1].permissions).toHaveLength(1);
		});

		it('should return false for isLoading after completed operations', async () => {
			permissionsApiMock.getAllUnpaginated.mockReturnValue(throwError(() => new Error('Error')));
			await store.loadPermissions();

			expect(store.isLoading()).toBe(false);
		});
	});

	describe('clearError', () => {
		it('should clear the error field', async () => {
			permissionsApiMock.getAllUnpaginated.mockReturnValue(throwError(() => new Error('Error')));
			await store.loadPermissions();
			expect(store.error()).toBe('Failed to load permissions');

			store.clearError();

			expect(store.error()).toBeNull();
		});
	});
});
