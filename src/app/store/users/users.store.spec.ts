import { TestBed } from '@angular/core/testing';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import { UserStatus } from '@contracts/user/user.schemas';
import type {
	CreateUserRequest,
	CreateUserResponse,
	ManagedUser,
	UpdateUserRequest,
	UpdateUserStatusRequest,
} from '@contracts/user/user.types';
import { UsersApiService } from '@providers/users/users';
import { clearAllMocks, fn, type MockFn } from '@test-utils';
import { NEVER, of, throwError, type Observable } from 'rxjs';
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
	let usersApiMock: {
		getAll: MockFn<[{ offset?: number; limit?: number; search?: string }?], Observable<PaginatedResponse<ManagedUser>>>;
		getById: MockFn<[number], Observable<ManagedUser>>;
		create: MockFn<[CreateUserRequest], Observable<CreateUserResponse>>;
		update: MockFn<[number, UpdateUserRequest], Observable<ManagedUser>>;
		delete: MockFn<[number], Observable<void>>;
		updateStatus: MockFn<[number, UpdateUserStatusRequest], Observable<ManagedUser>>;
	};

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

		TestBed.configureTestingModule({
			providers: [UsersStore, { provide: UsersApiService, useValue: usersApiMock }],
		});

		store = TestBed.inject(UsersStore);
	});

	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(store.users()).toEqual([]);
			expect(store.selectedUser()).toBeNull();
			expect(store.currentPage()).toBe(1);
			expect(store.pageSize()).toBe(10);
			expect(store.totalItems()).toBe(0);
			expect(store.totalPages()).toBe(0);
			expect(store.searchQuery()).toBe('');
			expect(store.isLoadingList()).toBe(false);
			expect(store.isCreating()).toBe(false);
			expect(store.isUpdating()).toBe(false);
			expect(store.isDeleting()).toBe(false);
			expect(store.listError()).toBeNull();
			expect(store.mutationError()).toBeNull();
		});

		it('should have correct computed signals', () => {
			expect(store.hasNextPage()).toBe(false);
			expect(store.hasPreviousPage()).toBe(false);
			expect(store.isAnyLoading()).toBe(false);
		});
	});

	describe('loadUsers', () => {
		it('should load users and update state on success', async () => {
			const mockUser = createMockManagedUser();
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([mockUser], 1)));

			await store.loadUsers();

			expect(store.users()).toHaveLength(1);
			expect(store.users()[0].fullName).toBe('John Doe');
			expect(store.users()[0].status).toBe(UserStatus.ACTIVE);
			expect(store.totalItems()).toBe(1);
			expect(store.totalPages()).toBe(1);
			expect(store.isLoadingList()).toBe(false);
			expect(store.listError()).toBeNull();
		});

		it('should send correct offset based on currentPage and pageSize', () => {
			// Mock returns synchronously via of() — setPage calls loadUsers internally
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 0)));
			store.setPage(3);

			const lastCall = usersApiMock.getAll.calls[usersApiMock.getAll.calls.length - 1];
			expect(lastCall[0]).toEqual({ offset: 20, limit: 10, search: undefined });
		});

		it('should compute totalPages correctly', async () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 25)));

			await store.loadUsers();

			expect(store.totalPages()).toBe(3);
		});

		it('should set listError on failure', async () => {
			usersApiMock.getAll.mockReturnValue(throwError(() => new Error('Network error')));

			await store.loadUsers();

			expect(store.isLoadingList()).toBe(false);
			expect(store.listError()).toBe('Failed to load users');
		});

		it('should pass search query when set', () => {
			// Mock returns synchronously via of() — setSearchQuery calls loadUsers internally
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));
			store.setSearchQuery('admin');

			const lastCall = usersApiMock.getAll.calls[usersApiMock.getAll.calls.length - 1];
			expect(lastCall[0]).toEqual(expect.objectContaining({ search: 'admin' }));
		});

		it('should not send search param when query is empty', async () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));

			await store.loadUsers();

			const lastCall = usersApiMock.getAll.calls[usersApiMock.getAll.calls.length - 1];
			expect(lastCall[0]).toEqual(expect.objectContaining({ search: undefined }));
		});

		it('should return totalPages 0 when total is 0', async () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 0)));

			await store.loadUsers();

			expect(store.totalPages()).toBe(0);
		});
	});

	describe('createUser', () => {
		it('should prepend new user and increment totalItems on success', async () => {
			const existingUser = createMockManagedUser({ id: 1 });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([existingUser], 1)));
			await store.loadUsers();

			const newUser: CreateUserResponse = {
				...createMockManagedUser({ id: 2, email: 'new@example.com', firstName: 'New' }),
				passwordEmailSent: true,
			};
			usersApiMock.create.mockReturnValue(of(newUser));

			await store.createUser({
				email: 'new@example.com',
				firstName: 'New',
				lastName: 'User',
				mustChangePassword: true,
			});

			expect(store.users()).toHaveLength(2);
			expect(store.users()[0].email).toBe('new@example.com');
			expect(store.totalItems()).toBe(2);
			expect(store.isCreating()).toBe(false);
		});

		it('should recalculate totalPages after create', async () => {
			// Set up 10 items on page 1 (exactly 1 page)
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 10)));
			await store.loadUsers();
			expect(store.totalPages()).toBe(1);

			const newUser: CreateUserResponse = {
				...createMockManagedUser({ id: 11 }),
				passwordEmailSent: true,
			};
			usersApiMock.create.mockReturnValue(of(newUser));

			await store.createUser({
				email: 'new@example.com',
				firstName: 'New',
				lastName: 'User',
				mustChangePassword: true,
			});

			// 11 items / 10 per page = 2 pages
			expect(store.totalPages()).toBe(2);
		});

		it('should set mutationError on failure', async () => {
			usersApiMock.create.mockReturnValue(throwError(() => new Error('Conflict')));

			await store.createUser({
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
		it('should replace the updated user in the list on success', async () => {
			const user = createMockManagedUser({ id: 5, firstName: 'Old' });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 1)));
			await store.loadUsers();

			const updatedUser = createMockManagedUser({ id: 5, firstName: 'Updated' });
			usersApiMock.update.mockReturnValue(of(updatedUser));

			await store.updateUser(5, { firstName: 'Updated' });

			expect(store.users()[0].firstName).toBe('Updated');
			expect(store.isUpdating()).toBe(false);
		});

		it('should sync selectedUser when the updated user is selected', async () => {
			const user = createMockManagedUser({ id: 5, firstName: 'Old' });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 1)));
			await store.loadUsers();
			store.selectUser(store.users()[0]);

			const updatedUser = createMockManagedUser({ id: 5, firstName: 'Updated' });
			usersApiMock.update.mockReturnValue(of(updatedUser));

			await store.updateUser(5, { firstName: 'Updated' });

			expect(store.selectedUser()?.firstName).toBe('Updated');
		});

		it('should not change selectedUser when a different user is updated', async () => {
			const users = [createMockManagedUser({ id: 1 }), createMockManagedUser({ id: 2 })];
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse(users, 2)));
			await store.loadUsers();
			store.selectUser(store.users()[0]);

			const updatedUser = createMockManagedUser({ id: 2, firstName: 'Changed' });
			usersApiMock.update.mockReturnValue(of(updatedUser));

			await store.updateUser(2, { firstName: 'Changed' });

			expect(store.selectedUser()?.id).toBe(1);
		});

		it('should set mutationError on failure', async () => {
			usersApiMock.update.mockReturnValue(throwError(() => new Error('Not found')));

			await store.updateUser(1, { firstName: 'Fail' });

			expect(store.isUpdating()).toBe(false);
			expect(store.mutationError()).toBe('Failed to update user');
		});
	});

	describe('deleteUser', () => {
		it('should remove user from list and decrement totalItems on success', async () => {
			const users = [createMockManagedUser({ id: 1 }), createMockManagedUser({ id: 2 })];
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse(users, 2)));
			await store.loadUsers();

			usersApiMock.delete.mockReturnValue(of(undefined));

			await store.deleteUser(1);

			expect(store.users()).toHaveLength(1);
			expect(store.users()[0].id).toBe(2);
			expect(store.totalItems()).toBe(1);
			expect(store.isDeleting()).toBe(false);
		});

		it('should navigate to previous page when last item on current page is deleted', async () => {
			// Set up page 2 with one item — of() resolves synchronously
			const user = createMockManagedUser({ id: 10 });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 11)));
			store.setPage(2);

			// Now delete the only user on page 2
			usersApiMock.delete.mockReturnValue(of(undefined));
			// Re-mock getAll for the reload after page decrement
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 10)));

			await store.deleteUser(10);

			expect(store.currentPage()).toBe(1);
		});

		it('should recalculate totalPages on delete', async () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([createMockManagedUser({ id: 1 })], 11)));
			await store.loadUsers();
			expect(store.totalPages()).toBe(2);

			usersApiMock.delete.mockReturnValue(of(undefined));

			await store.deleteUser(1);

			// 10 items / 10 per page = 1 page
			expect(store.totalPages()).toBe(1);
		});

		it('should clear selectedUser when the deleted user is selected', async () => {
			const user = createMockManagedUser({ id: 1 });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user, createMockManagedUser({ id: 2 })], 2)));
			await store.loadUsers();
			store.selectUser(store.users()[0]);

			usersApiMock.delete.mockReturnValue(of(undefined));

			await store.deleteUser(1);

			expect(store.selectedUser()).toBeNull();
		});

		it('should not clear selectedUser when a different user is deleted', async () => {
			const users = [createMockManagedUser({ id: 1 }), createMockManagedUser({ id: 2 })];
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse(users, 2)));
			await store.loadUsers();
			store.selectUser(store.users()[0]);

			usersApiMock.delete.mockReturnValue(of(undefined));

			await store.deleteUser(2);

			expect(store.selectedUser()?.id).toBe(1);
		});

		it('should set mutationError on failure', async () => {
			usersApiMock.delete.mockReturnValue(throwError(() => new Error('Forbidden')));

			await store.deleteUser(1);

			expect(store.isDeleting()).toBe(false);
			expect(store.mutationError()).toBe('Failed to delete user');
		});
	});

	describe('updateUserStatus', () => {
		it('should replace user with updated status on success', async () => {
			const user = createMockManagedUser({ id: 3, status: UserStatus.ACTIVE });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 1)));
			await store.loadUsers();

			const updated = createMockManagedUser({ id: 3, status: UserStatus.DISABLED });
			usersApiMock.updateStatus.mockReturnValue(of(updated));

			await store.updateUserStatus(3, { status: UserStatus.DISABLED });

			expect(store.users()[0].status).toBe(UserStatus.DISABLED);
			expect(store.isUpdating()).toBe(false);
		});

		it('should set mutationError on failure', async () => {
			usersApiMock.updateStatus.mockReturnValue(throwError(() => new Error('Error')));

			await store.updateUserStatus(1, { status: UserStatus.DISABLED });

			expect(store.isUpdating()).toBe(false);
			expect(store.mutationError()).toBe('Failed to update user status');
		});
	});

	describe('setPage', () => {
		it('should update currentPage and trigger loadUsers', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));

			store.setPage(3);

			expect(store.currentPage()).toBe(3);
			expect(usersApiMock.getAll.calls.length).toBeGreaterThan(0);
		});
	});

	describe('setPageSize', () => {
		it('should reset to page 1 and update pageSize', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));

			store.setPage(3);
			store.setPageSize(25);

			expect(store.currentPage()).toBe(1);
			expect(store.pageSize()).toBe(25);
		});
	});

	describe('setSearchQuery', () => {
		it('should reset to page 1 and update searchQuery', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([])));

			store.setPage(3);
			store.setSearchQuery('test');

			expect(store.currentPage()).toBe(1);
			expect(store.searchQuery()).toBe('test');
		});
	});

	describe('selectUser', () => {
		it('should set selectedUser from loaded users', async () => {
			const user = createMockManagedUser({ id: 7 });
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([user], 1)));
			await store.loadUsers();

			store.selectUser(store.users()[0]);

			expect(store.selectedUser()?.id).toBe(7);
			expect(store.selectedUser()?.fullName).toBe('John Doe');
		});

		it('should clear selectedUser when passed null', () => {
			store.selectUser(null);

			expect(store.selectedUser()).toBeNull();
		});
	});

	describe('clearErrors', () => {
		it('should clear both listError and mutationError', async () => {
			usersApiMock.getAll.mockReturnValue(throwError(() => new Error('List error')));
			await store.loadUsers();
			expect(store.listError()).toBe('Failed to load users');

			usersApiMock.create.mockReturnValue(throwError(() => new Error('Create error')));
			await store.createUser({
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
		it('should compute hasNextPage correctly', async () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 25)));

			await store.loadUsers();

			// Page 1 of 3 → hasNextPage = true
			expect(store.hasNextPage()).toBe(true);
			expect(store.hasPreviousPage()).toBe(false);
		});

		it('should compute hasPreviousPage correctly', () => {
			usersApiMock.getAll.mockReturnValue(of(createMockListResponse([], 25)));
			store.setPage(2);

			expect(store.hasPreviousPage()).toBe(true);
		});

		it('should return true for isAnyLoading during a load operation', () => {
			// NEVER keeps the store in loading state indefinitely
			usersApiMock.getAll.mockReturnValue(NEVER);

			// Fire and forget — the promise never resolves
			void store.loadUsers();

			expect(store.isLoadingList()).toBe(true);
			expect(store.isAnyLoading()).toBe(true);
		});

		it('should return false for isAnyLoading after all operations complete', async () => {
			expect(store.isAnyLoading()).toBe(false);

			usersApiMock.getAll.mockReturnValue(throwError(() => new Error('Error')));
			await store.loadUsers();

			expect(store.isAnyLoading()).toBe(false);
		});
	});
});
