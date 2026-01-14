import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearAllMocks, fn, resetTestCradle, setTestCradle } from '../../container.mock';
import type { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import type { PaginatedResponse, PermissionData, RoleData } from './interfaces';
import { ADMIN_USER_ROLE_PERMISSIONS } from './permissions.constants';
import userRoleController from './user-role.controller';
import { USER_ROLE_ERRORS } from './user-role.service';

describe('User Role Controller', () => {
	// Create mock functions
	const mockGetUserRoles = fn<[number, { offset?: number; limit?: number }?], Promise<PaginatedResponse<RoleData>>>();
	const mockGetUserPermissions = fn<[number], Promise<PermissionData[]>>();
	const mockAssignRoleToUser = fn<[number, number], Promise<void>>();
	const mockRemoveRoleFromUser = fn<[number, number], Promise<void>>();

	// Create app with auth middleware that simulates authenticated user
	let app: Hono;

	// Test data
	const testRole: RoleData = {
		id: 1,
		name: 'Admin',
		code: 'admin',
		description: 'Administrator',
		removable: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	};

	const testPermissions: PermissionData[] = [
		{ id: 1, name: 'can_create_users', description: 'Create users', resource: 'users', action: 'create' },
	];

	// All admin:user_roles:* permissions for testing (for authenticated user ID 999)
	const allUserRolePermissions: PermissionData[] = [
		{
			id: 1,
			name: ADMIN_USER_ROLE_PERMISSIONS.READ,
			description: 'Read user roles',
			resource: 'user_roles',
			action: 'read',
		},
		{
			id: 2,
			name: ADMIN_USER_ROLE_PERMISSIONS.ASSIGN,
			description: 'Assign roles',
			resource: 'user_roles',
			action: 'assign',
		},
		{
			id: 3,
			name: ADMIN_USER_ROLE_PERMISSIONS.REMOVE,
			description: 'Remove roles',
			resource: 'user_roles',
			action: 'remove',
		},
	];

	// The authenticated admin user ID
	const ADMIN_USER_ID = 999;

	beforeEach(() => {
		clearAllMocks();

		// Mock getUserPermissions to return different results based on user ID:
		// - For the authenticated admin user (ID 999): return all user_role permissions
		// - For other users: return the test permissions or error as needed
		mockGetUserPermissions.mockImplementation((userId: number) => {
			if (userId === ADMIN_USER_ID) {
				// This is the permission check for the authenticated user
				return Promise.resolve(allUserRolePermissions);
			}
			// This is the actual endpoint call for the target user
			return Promise.resolve(testPermissions);
		});

		setTestCradle({
			userRoleService: {
				getUserRoles: mockGetUserRoles,
				getUserPermissions: mockGetUserPermissions,
				assignRoleToUser: mockAssignRoleToUser,
				removeRoleFromUser: mockRemoveRoleFromUser,
			},
		});

		// Create app with simulated authenticated user
		app = new Hono();
		app.use('*', async (c, next) => {
			(c as AuthenticatedContext).user = {
				sub: String(ADMIN_USER_ID),
				email: 'admin@example.com',
				firstName: 'Admin',
				lastName: 'User',
			};
			await next();
		});
		app.route('/users', userRoleController);
	});

	afterEach(() => {
		resetTestCradle();
	});

	describe('GET /users/:userId/roles', () => {
		it('should return paginated user roles', async () => {
			const paginatedResponse: PaginatedResponse<RoleData> = {
				data: [testRole],
				total: 1,
				offset: 0,
				limit: 10,
			};
			mockGetUserRoles.mockResolvedValue(paginatedResponse);

			const res = await app.request('/users/1/roles');

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(1);
			expect(data.total).toBe(1);
			expect(mockGetUserRoles.calls).toEqual([[1, { offset: undefined, limit: undefined }]]);
		});

		it('should pass pagination parameters', async () => {
			const paginatedResponse: PaginatedResponse<RoleData> = {
				data: [testRole],
				total: 1,
				offset: 5,
				limit: 5,
			};
			mockGetUserRoles.mockResolvedValue(paginatedResponse);

			const res = await app.request('/users/1/roles?offset=5&limit=5');

			expect(res.status).toBe(200);
			expect(mockGetUserRoles.calls).toEqual([[1, { offset: 5, limit: 5 }]]);
		});

		it('should return 404 when user not found', async () => {
			mockGetUserRoles.mockRejectedValue(new Error(USER_ROLE_ERRORS.USER_NOT_FOUND));

			const res = await app.request('/users/999/roles');

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(USER_ROLE_ERRORS.USER_NOT_FOUND);
		});

		it('should return 400 for invalid user ID', async () => {
			const res = await app.request('/users/invalid/roles');

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid user ID');
		});
	});

	describe('GET /users/:userId/permissions', () => {
		it('should return user permissions', async () => {
			// mockGetUserPermissions is already set up via mockImplementation in beforeEach
			// - Returns allUserRolePermissions for admin user (ID 999) - for permission check
			// - Returns testPermissions for other users - for the actual endpoint

			const res = await app.request('/users/1/permissions');

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(1);
			expect(data.data[0].name).toBe('can_create_users');
			// First call is from permission middleware (user 999), second is from endpoint (user 1)
			expect(mockGetUserPermissions.calls).toEqual([[ADMIN_USER_ID], [1]]);
		});

		it('should return 404 when user not found', async () => {
			// Override mockImplementation to throw for non-admin users
			mockGetUserPermissions.mockImplementation((userId: number) => {
				if (userId === ADMIN_USER_ID) {
					return Promise.resolve(allUserRolePermissions);
				}
				return Promise.reject(new Error(USER_ROLE_ERRORS.USER_NOT_FOUND));
			});

			const res = await app.request('/users/888/permissions');

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(USER_ROLE_ERRORS.USER_NOT_FOUND);
		});

		it('should return 400 for invalid user ID', async () => {
			const res = await app.request('/users/invalid/permissions');

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid user ID');
		});
	});

	describe('POST /users/:userId/roles', () => {
		it('should assign role to user', async () => {
			mockAssignRoleToUser.mockResolvedValue(undefined);

			const res = await app.request('/users/1/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roleId: 1 }),
			});

			expect(res.status).toBe(201);
			const data = await res.json();
			expect(data.message).toBe('Role assigned successfully');
			expect(mockAssignRoleToUser.calls).toEqual([[1, 1]]);
		});

		it('should return 404 when user not found', async () => {
			mockAssignRoleToUser.mockRejectedValue(new Error(USER_ROLE_ERRORS.USER_NOT_FOUND));

			const res = await app.request('/users/999/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roleId: 1 }),
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(USER_ROLE_ERRORS.USER_NOT_FOUND);
		});

		it('should return 404 when role not found', async () => {
			mockAssignRoleToUser.mockRejectedValue(new Error(USER_ROLE_ERRORS.ROLE_NOT_FOUND));

			const res = await app.request('/users/1/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roleId: 999 }),
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(USER_ROLE_ERRORS.ROLE_NOT_FOUND);
		});

		it('should return 409 when role already assigned', async () => {
			mockAssignRoleToUser.mockRejectedValue(new Error(USER_ROLE_ERRORS.ROLE_ALREADY_ASSIGNED));

			const res = await app.request('/users/1/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roleId: 1 }),
			});

			expect(res.status).toBe(409);
			const data = await res.json();
			expect(data.error).toBe(USER_ROLE_ERRORS.ROLE_ALREADY_ASSIGNED);
		});

		it('should return 400 for invalid user ID', async () => {
			const res = await app.request('/users/invalid/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roleId: 1 }),
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid user ID');
		});

		it('should return 400 for invalid roleId', async () => {
			const res = await app.request('/users/1/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roleId: -1 }),
			});

			expect(res.status).toBe(400);
		});

		it('should return 400 when roleId is missing', async () => {
			const res = await app.request('/users/1/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			expect(res.status).toBe(400);
		});
	});

	describe('DELETE /users/:userId/roles/:roleId', () => {
		it('should remove role from user', async () => {
			mockRemoveRoleFromUser.mockResolvedValue(undefined);

			const res = await app.request('/users/1/roles/1', {
				method: 'DELETE',
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.message).toBe('Role removed successfully');
			expect(mockRemoveRoleFromUser.calls).toEqual([[1, 1]]);
		});

		it('should return 404 when user not found', async () => {
			mockRemoveRoleFromUser.mockRejectedValue(new Error(USER_ROLE_ERRORS.USER_NOT_FOUND));

			const res = await app.request('/users/999/roles/1', {
				method: 'DELETE',
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(USER_ROLE_ERRORS.USER_NOT_FOUND);
		});

		it('should return 404 when role not assigned', async () => {
			mockRemoveRoleFromUser.mockRejectedValue(new Error(USER_ROLE_ERRORS.ROLE_NOT_ASSIGNED));

			const res = await app.request('/users/1/roles/999', {
				method: 'DELETE',
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(USER_ROLE_ERRORS.ROLE_NOT_ASSIGNED);
		});

		it('should return 400 for invalid user ID', async () => {
			const res = await app.request('/users/invalid/roles/1', {
				method: 'DELETE',
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid user ID');
		});

		it('should return 400 for invalid role ID', async () => {
			const res = await app.request('/users/1/roles/invalid', {
				method: 'DELETE',
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid role ID');
		});
	});
});
