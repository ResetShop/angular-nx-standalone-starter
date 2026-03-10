import { TestBed } from '@angular/core/testing';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type {
	AssignPermissionsRequest,
	CreateRoleRequest,
	RoleData,
	RoleWithPermissions,
	UpdateRoleRequest,
} from '@contracts/role/role.types';
import { RolesApiService } from '@providers/roles/roles';
import { clearAllMocks, fn, type MockFn } from '@test-utils';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import { RolesStore } from './roles.store';

function createMockRoleData(overrides: Partial<RoleData> = {}): RoleData {
	return {
		id: 1,
		name: 'Admin',
		code: 'admin',
		description: null,
		removable: true,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		...overrides,
	};
}

function createMockRoleWithPermissions(overrides: Partial<RoleWithPermissions> = {}): RoleWithPermissions {
	return {
		id: 1,
		code: 'admin',
		name: 'Admin',
		description: null,
		permissions: [{ id: 1, name: 'Read Users', description: null, resource: 'users', action: 'read' }],
		...overrides,
	};
}

function createMockListResponse(roles: RoleData[], total?: number): PaginatedResponse<RoleData> {
	return {
		data: roles,
		total: total ?? roles.length,
		offset: 0,
		limit: 10,
	};
}

describe('RolesStore', () => {
	let store: InstanceType<typeof RolesStore>;
	let rolesApiMock: {
		getAll: MockFn<[{ offset?: number; limit?: number; search?: string }?], Observable<PaginatedResponse<RoleData>>>;
		getAllUnpaginated: MockFn<[], Observable<RoleData[]>>;
		getByIdWithPermissions: MockFn<[number], Observable<RoleWithPermissions>>;
		create: MockFn<[CreateRoleRequest], Observable<RoleData>>;
		update: MockFn<[number, UpdateRoleRequest], Observable<RoleData>>;
		delete: MockFn<[number], Observable<void>>;
		assignPermissions: MockFn<[number, AssignPermissionsRequest], Observable<void>>;
	};

	beforeEach(() => {
		clearAllMocks();

		rolesApiMock = {
			getAll: fn(),
			getAllUnpaginated: fn(),
			getByIdWithPermissions: fn(),
			create: fn(),
			update: fn(),
			delete: fn(),
			assignPermissions: fn(),
		};

		TestBed.configureTestingModule({
			providers: [RolesStore, { provide: RolesApiService, useValue: rolesApiMock }],
		});

		store = TestBed.inject(RolesStore);
	});

	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(store.roles()).toEqual([]);
			expect(store.allRoles()).toEqual([]);
			expect(store.selectedRole()).toBeNull();
			expect(store.currentPage()).toBe(1);
			expect(store.pageSize()).toBe(10);
			expect(store.totalItems()).toBe(0);
			expect(store.totalPages()).toBe(0);
			expect(store.searchQuery()).toBe('');
			expect(store.isLoadingList()).toBe(false);
			expect(store.isLoadingAll()).toBe(false);
			expect(store.isLoadingDetail()).toBe(false);
			expect(store.isCreating()).toBe(false);
			expect(store.isUpdating()).toBe(false);
			expect(store.isDeleting()).toBe(false);
			expect(store.isAssigningPermissions()).toBe(false);
			expect(store.readError()).toBeNull();
			expect(store.mutationError()).toBeNull();
		});

		it('should have correct computed signals', () => {
			expect(store.hasNextPage()).toBe(false);
			expect(store.hasPreviousPage()).toBe(false);
			expect(store.isAnyLoading()).toBe(false);
		});
	});

	describe('loadRoles', () => {
		it('should load roles and update state on success', async () => {
			const mockRole = createMockRoleData();
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([mockRole], 1)));

			await store.loadRoles();

			expect(store.roles()).toHaveLength(1);
			expect(store.roles()[0].name).toBe('Admin');
			expect(store.roles()[0].code).toBe('admin');
			expect(store.totalItems()).toBe(1);
			expect(store.totalPages()).toBe(1);
			expect(store.isLoadingList()).toBe(false);
			expect(store.readError()).toBeNull();
		});

		it('should send correct offset based on currentPage and pageSize', () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([], 0)));
			store.setPage(3);

			const lastCall = rolesApiMock.getAll.calls[rolesApiMock.getAll.calls.length - 1];
			expect(lastCall[0]).toEqual({ offset: 20, limit: 10, search: undefined });
		});

		it('should compute totalPages correctly', async () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([], 25)));

			await store.loadRoles();

			expect(store.totalPages()).toBe(3);
		});

		it('should set readError on failure', async () => {
			rolesApiMock.getAll.mockReturnValue(throwError(() => new Error('Network error')));

			await store.loadRoles();

			expect(store.isLoadingList()).toBe(false);
			expect(store.readError()).toBe('Failed to load roles');
		});

		it('should pass search query when set', () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			store.setSearchQuery('admin');

			const lastCall = rolesApiMock.getAll.calls[rolesApiMock.getAll.calls.length - 1];
			expect(lastCall[0]).toEqual(expect.objectContaining({ search: 'admin' }));
		});

		it('should not send search param when query is empty', async () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([])));

			await store.loadRoles();

			const lastCall = rolesApiMock.getAll.calls[rolesApiMock.getAll.calls.length - 1];
			expect(lastCall[0]).toEqual(expect.objectContaining({ search: undefined }));
		});
	});

	describe('loadAllRoles', () => {
		it('should load all roles and update allRoles state', async () => {
			const roles = [createMockRoleData({ id: 1 }), createMockRoleData({ id: 2, name: 'Editor', code: 'editor' })];
			rolesApiMock.getAllUnpaginated.mockReturnValue(of(roles));

			await store.loadAllRoles();

			expect(store.allRoles()).toHaveLength(2);
			expect(store.isLoadingAll()).toBe(false);
		});

		it('should set isLoadingAll during load', () => {
			rolesApiMock.getAllUnpaginated.mockReturnValue(NEVER);

			void store.loadAllRoles();

			expect(store.isLoadingAll()).toBe(true);
		});

		it('should set readError on failure', async () => {
			rolesApiMock.getAllUnpaginated.mockReturnValue(throwError(() => new Error('Error')));

			await store.loadAllRoles();

			expect(store.isLoadingAll()).toBe(false);
			expect(store.readError()).toBe('Failed to load roles');
		});
	});

	describe('loadRole', () => {
		it('should load role with permissions and set selectedRole', async () => {
			const roleWithPerms = createMockRoleWithPermissions();
			rolesApiMock.getByIdWithPermissions.mockReturnValue(of(roleWithPerms));

			await store.loadRole(1);

			const selected = store.selectedRole();
			expect(selected).not.toBeNull();
			expect(selected?.id).toBe(1);
			expect(selected?.name).toBe('Admin');
			expect(selected?.permissions).toHaveLength(1);
			expect(selected?.hasPermission('users', 'read')).toBe(true);
			expect(store.isLoadingDetail()).toBe(false);
		});

		it('should set isLoadingDetail during load', () => {
			rolesApiMock.getByIdWithPermissions.mockReturnValue(NEVER);

			void store.loadRole(1);

			expect(store.isLoadingDetail()).toBe(true);
		});

		it('should set readError on failure', async () => {
			rolesApiMock.getByIdWithPermissions.mockReturnValue(throwError(() => new Error('Not found')));

			await store.loadRole(999);

			expect(store.isLoadingDetail()).toBe(false);
			expect(store.readError()).toBe('Failed to load role');
		});
	});

	describe('createRole', () => {
		it('should prepend new role and increment totalItems on success', async () => {
			const existingRole = createMockRoleData({ id: 1 });
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([existingRole], 1)));
			await store.loadRoles();

			const newRole = createMockRoleData({ id: 2, name: 'Editor', code: 'editor' });
			rolesApiMock.create.mockReturnValue(of(newRole));

			await store.createRole({ name: 'Editor', code: 'editor' });

			expect(store.roles()).toHaveLength(2);
			expect(store.roles()[0].name).toBe('Editor');
			expect(store.totalItems()).toBe(2);
			expect(store.isCreating()).toBe(false);
		});

		it('should recalculate totalPages after create', async () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([], 10)));
			await store.loadRoles();
			expect(store.totalPages()).toBe(1);

			const newRole = createMockRoleData({ id: 11 });
			rolesApiMock.create.mockReturnValue(of(newRole));

			await store.createRole({ name: 'New', code: 'new_role' });

			// 11 items / 10 per page = 2 pages
			expect(store.totalPages()).toBe(2);
		});

		it('should set mutationError on failure', async () => {
			rolesApiMock.create.mockReturnValue(throwError(() => new Error('Conflict')));

			await store.createRole({ name: 'Fail', code: 'fail' });

			expect(store.isCreating()).toBe(false);
			expect(store.mutationError()).toBe('Failed to create role');
		});
	});

	describe('updateRole', () => {
		it('should replace the updated role in the list on success', async () => {
			const role = createMockRoleData({ id: 5, name: 'Old Name' });
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([role], 1)));
			await store.loadRoles();

			const updatedRole = createMockRoleData({ id: 5, name: 'Updated Name' });
			rolesApiMock.update.mockReturnValue(of(updatedRole));

			await store.updateRole(5, { name: 'Updated Name' });

			expect(store.roles()[0].name).toBe('Updated Name');
			expect(store.isUpdating()).toBe(false);
		});

		it('should reload detail when the updated role is selected', async () => {
			const role = createMockRoleData({ id: 5 });
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([role], 1)));
			await store.loadRoles();

			// Load role detail to set selectedRole
			const roleWithPerms = createMockRoleWithPermissions({ id: 5 });
			rolesApiMock.getByIdWithPermissions.mockReturnValue(of(roleWithPerms));
			await store.loadRole(5);

			const updatedRole = createMockRoleData({ id: 5, name: 'Updated' });
			rolesApiMock.update.mockReturnValue(of(updatedRole));
			// Re-mock for the detail reload triggered by updateRole
			rolesApiMock.getByIdWithPermissions.mockReturnValue(
				of(createMockRoleWithPermissions({ id: 5, name: 'Updated' })),
			);

			await store.updateRole(5, { name: 'Updated' });

			// Verify getByIdWithPermissions was called for the reload
			const detailCalls = rolesApiMock.getByIdWithPermissions.calls;
			expect(detailCalls.length).toBeGreaterThanOrEqual(2);
			expect(detailCalls[detailCalls.length - 1][0]).toBe(5);
		});

		it('should not reload detail when a different role is updated', async () => {
			const roles = [createMockRoleData({ id: 1 }), createMockRoleData({ id: 2 })];
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse(roles, 2)));
			await store.loadRoles();

			// Select role 1
			const roleWithPerms = createMockRoleWithPermissions({ id: 1 });
			rolesApiMock.getByIdWithPermissions.mockReturnValue(of(roleWithPerms));
			await store.loadRole(1);
			const detailCallsBefore = rolesApiMock.getByIdWithPermissions.calls.length;

			const updatedRole = createMockRoleData({ id: 2, name: 'Changed' });
			rolesApiMock.update.mockReturnValue(of(updatedRole));

			await store.updateRole(2, { name: 'Changed' });

			// No additional detail call should have been made
			expect(rolesApiMock.getByIdWithPermissions.calls).toHaveLength(detailCallsBefore);
		});

		it('should set mutationError on failure', async () => {
			rolesApiMock.update.mockReturnValue(throwError(() => new Error('Not found')));

			await store.updateRole(1, { name: 'Fail' });

			expect(store.isUpdating()).toBe(false);
			expect(store.mutationError()).toBe('Failed to update role');
		});
	});

	describe('deleteRole', () => {
		it('should remove role from list and decrement totalItems on success', async () => {
			const roles = [createMockRoleData({ id: 1 }), createMockRoleData({ id: 2, name: 'Editor', code: 'editor' })];
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse(roles, 2)));
			await store.loadRoles();

			rolesApiMock.delete.mockReturnValue(of(undefined));

			await store.deleteRole(1);

			expect(store.roles()).toHaveLength(1);
			expect(store.roles()[0].id).toBe(2);
			expect(store.totalItems()).toBe(1);
			expect(store.isDeleting()).toBe(false);
		});

		it('should clear selectedRole when the deleted role is selected', async () => {
			const role = createMockRoleData({ id: 1 });
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([role, createMockRoleData({ id: 2 })], 2)));
			await store.loadRoles();

			const roleWithPerms = createMockRoleWithPermissions({ id: 1 });
			rolesApiMock.getByIdWithPermissions.mockReturnValue(of(roleWithPerms));
			await store.loadRole(1);

			rolesApiMock.delete.mockReturnValue(of(undefined));

			await store.deleteRole(1);

			expect(store.selectedRole()).toBeNull();
		});

		it('should not clear selectedRole when a different role is deleted', async () => {
			const roles = [createMockRoleData({ id: 1 }), createMockRoleData({ id: 2 })];
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse(roles, 2)));
			await store.loadRoles();

			const roleWithPerms = createMockRoleWithPermissions({ id: 1 });
			rolesApiMock.getByIdWithPermissions.mockReturnValue(of(roleWithPerms));
			await store.loadRole(1);

			rolesApiMock.delete.mockReturnValue(of(undefined));

			await store.deleteRole(2);

			expect(store.selectedRole()?.id).toBe(1);
		});

		it('should remove from allRoles when deleted', async () => {
			const roles = [createMockRoleData({ id: 1 }), createMockRoleData({ id: 2 })];
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse(roles, 2)));
			await store.loadRoles();

			rolesApiMock.getAllUnpaginated.mockReturnValue(of(roles));
			await store.loadAllRoles();

			rolesApiMock.delete.mockReturnValue(of(undefined));

			await store.deleteRole(1);

			expect(store.allRoles()).toHaveLength(1);
			expect(store.allRoles()[0].id).toBe(2);
		});

		it('should navigate to previous page when last item on current page is deleted', async () => {
			const role = createMockRoleData({ id: 10 });
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([role], 11)));
			store.setPage(2);

			rolesApiMock.delete.mockReturnValue(of(undefined));
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([], 10)));

			await store.deleteRole(10);

			expect(store.currentPage()).toBe(1);
		});

		it('should recalculate totalPages on delete', async () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([createMockRoleData({ id: 1 })], 11)));
			await store.loadRoles();
			expect(store.totalPages()).toBe(2);

			rolesApiMock.delete.mockReturnValue(of(undefined));

			await store.deleteRole(1);

			// 10 items / 10 per page = 1 page
			expect(store.totalPages()).toBe(1);
		});

		it('should set mutationError on failure', async () => {
			rolesApiMock.delete.mockReturnValue(throwError(() => new Error('Forbidden')));

			await store.deleteRole(1);

			expect(store.isDeleting()).toBe(false);
			expect(store.mutationError()).toBe('Failed to delete role');
		});
	});

	describe('assignPermissions', () => {
		it('should reload role detail after successful assignment', async () => {
			const roleWithPerms = createMockRoleWithPermissions({ id: 5 });
			rolesApiMock.getByIdWithPermissions.mockReturnValue(of(roleWithPerms));
			await store.loadRole(5);

			rolesApiMock.assignPermissions.mockReturnValue(of(undefined));
			// Re-mock for the detail reload after assignment
			const updatedPerms = createMockRoleWithPermissions({
				id: 5,
				permissions: [
					{ id: 1, name: 'Read Users', description: null, resource: 'users', action: 'read' },
					{ id: 2, name: 'Write Users', description: null, resource: 'users', action: 'write' },
				],
			});
			rolesApiMock.getByIdWithPermissions.mockReturnValue(of(updatedPerms));

			await store.assignPermissions(5, { permissionIds: [1, 2] });

			expect(store.isAssigningPermissions()).toBe(false);
			// Verify detail was reloaded
			const detailCalls = rolesApiMock.getByIdWithPermissions.calls;
			expect(detailCalls.length).toBeGreaterThanOrEqual(2);
		});

		it('should set isAssigningPermissions during assignment', () => {
			rolesApiMock.assignPermissions.mockReturnValue(NEVER);

			void store.assignPermissions(5, { permissionIds: [1] });

			expect(store.isAssigningPermissions()).toBe(true);
		});

		it('should set mutationError on failure', async () => {
			rolesApiMock.assignPermissions.mockReturnValue(throwError(() => new Error('Bad request')));

			await store.assignPermissions(5, { permissionIds: [999] });

			expect(store.isAssigningPermissions()).toBe(false);
			expect(store.mutationError()).toBe('Failed to assign permissions');
		});
	});

	describe('setPage', () => {
		it('should update currentPage and trigger loadRoles', () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([])));

			store.setPage(3);

			expect(store.currentPage()).toBe(3);
			expect(rolesApiMock.getAll.calls.length).toBeGreaterThan(0);
		});
	});

	describe('setPageSize', () => {
		it('should reset to page 1 and update pageSize', () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([])));

			store.setPage(3);
			store.setPageSize(25);

			expect(store.currentPage()).toBe(1);
			expect(store.pageSize()).toBe(25);
		});
	});

	describe('setSearchQuery', () => {
		it('should reset to page 1 and update searchQuery', () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([])));

			store.setPage(3);
			store.setSearchQuery('test');

			expect(store.currentPage()).toBe(1);
			expect(store.searchQuery()).toBe('test');
		});
	});

	describe('selectRole', () => {
		it('should set selectedRole from loaded role', async () => {
			const roleWithPerms = createMockRoleWithPermissions({ id: 7 });
			rolesApiMock.getByIdWithPermissions.mockReturnValue(of(roleWithPerms));
			await store.loadRole(7);

			expect(store.selectedRole()?.id).toBe(7);
			expect(store.selectedRole()?.name).toBe('Admin');
		});

		it('should clear selectedRole when passed null', () => {
			store.selectRole(null);

			expect(store.selectedRole()).toBeNull();
		});
	});

	describe('clearErrors', () => {
		it('should clear both readError and mutationError', async () => {
			rolesApiMock.getAll.mockReturnValue(throwError(() => new Error('List error')));
			await store.loadRoles();
			expect(store.readError()).toBe('Failed to load roles');

			rolesApiMock.create.mockReturnValue(throwError(() => new Error('Create error')));
			await store.createRole({ name: 'Fail', code: 'fail' });
			expect(store.mutationError()).toBe('Failed to create role');

			store.clearErrors();

			expect(store.readError()).toBeNull();
			expect(store.mutationError()).toBeNull();
		});
	});

	describe('computed signals', () => {
		it('should compute hasNextPage correctly', async () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([], 25)));

			await store.loadRoles();

			// Page 1 of 3 → hasNextPage = true
			expect(store.hasNextPage()).toBe(true);
			expect(store.hasPreviousPage()).toBe(false);
		});

		it('should compute hasPreviousPage correctly', () => {
			rolesApiMock.getAll.mockReturnValue(of(createMockListResponse([], 25)));
			store.setPage(2);

			expect(store.hasPreviousPage()).toBe(true);
		});

		it('should return true for isAnyLoading during a load operation', () => {
			rolesApiMock.getAll.mockReturnValue(NEVER);

			void store.loadRoles();

			expect(store.isLoadingList()).toBe(true);
			expect(store.isAnyLoading()).toBe(true);
		});

		it('should return false for isAnyLoading after all operations complete', async () => {
			expect(store.isAnyLoading()).toBe(false);

			rolesApiMock.getAll.mockReturnValue(throwError(() => new Error('Error')));
			await store.loadRoles();

			expect(store.isAnyLoading()).toBe(false);
		});
	});
});
