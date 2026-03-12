import { TestBed } from '@angular/core/testing';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import { UserStatus } from '@contracts/user/user.schemas';
import type { CreateUserResponse, ManagedUser } from '@contracts/user/user.types';
import { UsersApiService } from '@providers/users/users';
import { clearAllMocks, fn, type MockFn } from '@test-utils';
import { EMPTY, NEVER, of, throwError } from 'rxjs';
import { UsersStore } from './users.store';

function createMockManagedUser(overrides: Partial<ManagedUser> = {}): ManagedUser {
	return {
		id: 1,
		email: 'john@example.com',
		firstName: 'John',
		lastName: 'Doe',
		status: UserStatus.ACTIVE,
		statusChangedAt: null,
		statusChangedBy: null,
		deletedAt: null,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		roles: [
			{
				id: 1,
				name: 'Admin',
				code: 'admin',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
			},
		],
		...overrides,
	};
}

function createMockListResponse(users: ManagedUser[], total?: number): PaginatedResponse<ManagedUser> {
	return {
		data: users,
		total: total ?? users.length,
		offset: 0,
		limit: 10,
	};
}

describe('UsersStore', () => {
	let store: InstanceType<typeof UsersStore>;
	let usersApiMock: Record<keyof UsersApiService, MockFn>;

	/**
	 * Helper: configures TestBed with the mock and injects the store.
	 * getAll must be mocked BEFORE calling this, because withHooks.onInit
	 * triggers loadUsers immediately on store creation.
	 */
	function setupStore(): void {
		TestBed.configureTestingModule({
			providers: [UsersStore, { provide: UsersApiService, useValue: usersApiMock }],
		});
		store = TestBed.inject(UsersStore);
		TestBed.tick();
	}

	beforeEach(() => {
		clearAllMocks();

		usersApiMock = {
			getAll: fn(),
			getById: fn(),
			create: fn(),
			update: fn(),
			delete: fn(),
			updateStatus: fn(),
		};
	});

	describe('initial state', () => {
		it('should have correct initial state', () => {
			usersApiMock.getAll.mockReturnValue(EMPTY);
			setupStore();

			expect(store.users()).toEqual([]);
			expect(store.selectedUser()).toBeNull();
			expect(store.currentPage()).toBe(1);
			expect(store.pageSize()).toBe(10);
			expect(store.totalItems()).toBe(0);
			expect(store.totalPages()).toBe(0);
			expect(store.searchQuery()).toBe('');
			expect(store.isCreating()).toBe(false);
			expect(store.isUpdating()).toBe(false);
			expect(store.isDeleting()).toBe(false);
			expect(store.listError()).toBeNull();
			expect(store.mutationError()).toBeNull();
		});

		it('should have correct computed signals', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			expect(store.hasNextPage()).toBe(false);
			expect(store.hasPreviousPage()).toBe(false);
			expect(store.isAnyLoading()).toBe(false);
		});
	});

	describe('loadUsers (reactive via onInit)', () => {
		it('should load users and update state on success', () => {
			const mockUser = createMockManagedUser();
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([mockUser], 1)));
			setupStore();

			expect(store.users()).toHaveLength(1);
			expect(store.users()[0].fullName).toBe('John Doe');
			expect(store.users()[0].status).toBe(UserStatus.ACTIVE);
			expect(store.totalItems()).toBe(1);
			expect(store.totalPages()).toBe(1);
			expect(store.isLoadingList()).toBe(false);
			expect(store.listError()).toBeNull();
		});

		it('should send correct offset based on currentPage and pageSize', () => {
			// Initial load with empty response
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 0)));
			setupStore();

			// setPage triggers reactive re-fetch via listParams signal change
			store.setPage(3);
			TestBed.tick();

			const lastCall = usersApiMock.getAll.calls[usersApiMock.getAll.calls.length - 1];
			expect(lastCall[0]).toEqual({ offset: 20, limit: 10, search: undefined });
		});

		it('should compute totalPages correctly', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 25)));
			setupStore();

			expect(store.totalPages()).toBe(3);
		});

		it('should set listError on failure', () => {
			usersApiMock.getAll.mockReturnValue(throwError(() => new Error('Network error')));
			setupStore();

			expect(store.isLoadingList()).toBe(false);
			expect(store.listError()).toBe('Failed to load users');
		});

		it('should pass search query when set', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			store.setSearchQuery('admin');
			TestBed.tick();

			const lastCall = usersApiMock.getAll.calls[usersApiMock.getAll.calls.length - 1];
			expect(lastCall[0]).toEqual(expect.objectContaining({ search: 'admin' }));
		});

		it('should not send search param when query is empty', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			const lastCall = usersApiMock.getAll.calls[usersApiMock.getAll.calls.length - 1];
			expect(lastCall[0]).toEqual(expect.objectContaining({ search: undefined }));
		});

		it('should return totalPages 0 when total is 0', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 0)));
			setupStore();

			expect(store.totalPages()).toBe(0);
		});

		it('should set isLoadingList while request is in flight', () => {
			usersApiMock.getAll.mockReturnValue(NEVER);
			setupStore();

			expect(store.isLoadingList()).toBe(true);
			expect(store.isAnyLoading()).toBe(true);
		});
	});

	describe('createUser', () => {
		it('should reload the list from the server on success', () => {
			const existingUser = createMockManagedUser({ id: 1 });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([existingUser], 1)));
			setupStore();

			const newUser: CreateUserResponse = {
				...createMockManagedUser({ id: 2, email: 'new@example.com', firstName: 'New' }),
				passwordEmailSent: true,
			};
			usersApiMock.create.mockReturnValue(of(newUser));

			// After create, the store reloads — mock the server-authoritative response
			const reloadedUsers = [existingUser, createMockManagedUser({ id: 2, email: 'new@example.com' })];
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse(reloadedUsers, 2)));

			store.createUser({
				email: 'new@example.com',
				firstName: 'New',
				lastName: 'User',
				mustChangePassword: true,
			});

			expect(store.users()).toHaveLength(2);
			expect(store.totalItems()).toBe(2);
			expect(store.isCreating()).toBe(false);
		});

		it('should set mutationError on failure', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			usersApiMock.create.mockReturnValue(throwError(() => new Error('Conflict')));

			store.createUser({
				email: 'fail@example.com',
				firstName: 'Fail',
				lastName: 'User',
				mustChangePassword: true,
			});

			expect(store.isCreating()).toBe(false);
			expect(store.mutationError()).toBe('Failed to create user');
		});
	});

	describe('updateUser', () => {
		it('should reload the list from the server on success', () => {
			const user = createMockManagedUser({ id: 5, firstName: 'Old' });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 1)));
			setupStore();

			usersApiMock.update.mockReturnValue(of(createMockManagedUser({ id: 5, firstName: 'Updated' })));

			// After update, the store reloads — mock the server-authoritative response
			const reloadedUser = createMockManagedUser({ id: 5, firstName: 'Updated' });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([reloadedUser], 1)));

			store.updateUser({ id: 5, body: { firstName: 'Updated' } });

			expect(store.users()[0].firstName).toBe('Updated');
			expect(store.isUpdating()).toBe(false);
		});

		it('should set mutationError on failure', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			usersApiMock.update.mockReturnValue(throwError(() => new Error('Not found')));

			store.updateUser({ id: 1, body: { firstName: 'Fail' } });

			expect(store.isUpdating()).toBe(false);
			expect(store.mutationError()).toBe('Failed to update user');
		});
	});

	describe('deleteUser', () => {
		it('should reload the list from the server on success', () => {
			const users = [createMockManagedUser({ id: 1 }), createMockManagedUser({ id: 2 })];
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse(users, 2)));
			setupStore();

			usersApiMock.delete.mockReturnValue(of(undefined));
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([createMockManagedUser({ id: 2 })], 1)));

			store.deleteUser(1);

			expect(store.users()).toHaveLength(1);
			expect(store.users()[0].id).toBe(2);
			expect(store.totalItems()).toBe(1);
			expect(store.isDeleting()).toBe(false);
		});

		it('should navigate to previous page when last item on current page is deleted', () => {
			const user = createMockManagedUser({ id: 10 });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 11)));
			setupStore();

			// Move to page 2 — triggers reactive re-fetch
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 11)));
			store.setPage(2);
			TestBed.tick();

			// Delete the only user on page 2 — patches currentPage to 1,
			// which triggers the reactive loadUsers chain automatically
			usersApiMock.delete.mockReturnValue(of(undefined));
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 10)));

			store.deleteUser(10);
			TestBed.tick();

			expect(store.currentPage()).toBe(1);
		});

		it('should clear selectedUser when the deleted user is selected', () => {
			const user = createMockManagedUser({ id: 1 });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user, createMockManagedUser({ id: 2 })], 2)));
			setupStore();
			store.selectUser(store.users()[0]);

			usersApiMock.delete.mockReturnValue(of(undefined));
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([createMockManagedUser({ id: 2 })], 1)));

			store.deleteUser(1);

			expect(store.selectedUser()).toBeNull();
		});

		it('should not clear selectedUser when a different user is deleted', () => {
			const users = [createMockManagedUser({ id: 1 }), createMockManagedUser({ id: 2 })];
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse(users, 2)));
			setupStore();
			store.selectUser(store.users()[0]);

			usersApiMock.delete.mockReturnValue(of(undefined));
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([createMockManagedUser({ id: 1 })], 1)));

			store.deleteUser(2);

			expect(store.selectedUser()?.id).toBe(1);
		});

		it('should set mutationError on failure', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			usersApiMock.delete.mockReturnValue(throwError(() => new Error('Forbidden')));

			store.deleteUser(1);

			expect(store.isDeleting()).toBe(false);
			expect(store.mutationError()).toBe('Failed to delete user');
		});
	});

	describe('updateUserStatus', () => {
		it('should reload the list from the server on success', () => {
			const user = createMockManagedUser({ id: 3, status: UserStatus.ACTIVE });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 1)));
			setupStore();

			usersApiMock.updateStatus.mockReturnValue(of(createMockManagedUser({ id: 3, status: UserStatus.DISABLED })));

			// After status update, the store reloads — mock the server-authoritative response
			const reloadedUser = createMockManagedUser({ id: 3, status: UserStatus.DISABLED });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([reloadedUser], 1)));

			store.updateUserStatus({ id: 3, body: { status: UserStatus.DISABLED } });

			expect(store.users()[0].status).toBe(UserStatus.DISABLED);
			expect(store.isUpdating()).toBe(false);
		});

		it('should set mutationError on failure', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			usersApiMock.updateStatus.mockReturnValue(throwError(() => new Error('Error')));

			store.updateUserStatus({ id: 1, body: { status: UserStatus.DISABLED } });

			expect(store.isUpdating()).toBe(false);
			expect(store.mutationError()).toBe('Failed to update user status');
		});
	});

	describe('setPage', () => {
		it('should update currentPage and trigger loadUsers reactively', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			const callsBefore = usersApiMock.getAll.calls.length;
			store.setPage(3);
			TestBed.tick();

			expect(store.currentPage()).toBe(3);
			expect(usersApiMock.getAll.calls.length).toBeGreaterThan(callsBefore);
		});
	});

	describe('setPageSize', () => {
		it('should reset to page 1 and update pageSize', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			store.setPage(3);
			TestBed.tick();
			store.setPageSize(25);
			TestBed.tick();

			expect(store.currentPage()).toBe(1);
			expect(store.pageSize()).toBe(25);
		});
	});

	describe('setSearchQuery', () => {
		it('should reset to page 1 and update searchQuery', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			store.setPage(3);
			TestBed.tick();
			store.setSearchQuery('test');
			TestBed.tick();

			expect(store.currentPage()).toBe(1);
			expect(store.searchQuery()).toBe('test');
		});
	});

	describe('selectUser', () => {
		it('should set selectedUser from loaded users', () => {
			const user = createMockManagedUser({ id: 7 });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 1)));
			setupStore();

			store.selectUser(store.users()[0]);

			expect(store.selectedUser()?.id).toBe(7);
			expect(store.selectedUser()?.fullName).toBe('John Doe');
		});

		it('should clear selectedUser when passed null', () => {
			usersApiMock.getAll.mockReturnValue(EMPTY);
			setupStore();

			store.selectUser(null);

			expect(store.selectedUser()).toBeNull();
		});
	});

	describe('clearErrors', () => {
		it('should clear both listError and mutationError', () => {
			usersApiMock.getAll.mockReturnValue(throwError(() => new Error('List error')));
			setupStore();
			expect(store.listError()).toBe('Failed to load users');

			usersApiMock.create.mockReturnValue(throwError(() => new Error('Create error')));
			store.createUser({
				email: 'fail@test.com',
				firstName: 'F',
				lastName: 'L',
				mustChangePassword: true,
			});
			expect(store.mutationError()).toBe('Failed to create user');

			store.clearErrors();

			expect(store.listError()).toBeNull();
			expect(store.mutationError()).toBeNull();
		});
	});

	describe('computed signals', () => {
		it('should compute hasNextPage correctly', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 25)));
			setupStore();

			// Page 1 of 3 → hasNextPage = true
			expect(store.hasNextPage()).toBe(true);
			expect(store.hasPreviousPage()).toBe(false);
		});

		it('should compute hasPreviousPage correctly', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 25)));
			setupStore();

			store.setPage(2);
			TestBed.tick();

			expect(store.hasPreviousPage()).toBe(true);
		});

		it('should return false for isAnyLoading after all operations complete', () => {
			usersApiMock.getAll.mockReturnValue(throwError(() => new Error('Error')));
			setupStore();

			expect(store.isAnyLoading()).toBe(false);
		});
	});

	describe('reload', () => {
		it('should trigger a re-fetch with the same params via imperative call', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			setupStore();

			const callsBefore = usersApiMock.getAll.calls.length;
			store.reload();

			expect(usersApiMock.getAll.calls.length).toBeGreaterThan(callsBefore);
		});
	});
});
