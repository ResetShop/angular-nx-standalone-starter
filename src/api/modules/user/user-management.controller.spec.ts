import { clearAllMocks, fn } from '@test-utils';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetTestCradle, setTestCradle } from '../../container.mock';
import type { PaginatedResponse } from '../../interfaces';
import type { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import type { PermissionData, RoleData } from '../access/role/interfaces';
import { ADMIN_USER_PERMISSIONS } from '../access/role/permissions.constants';
import type { ManagedUserData } from './interfaces';
import userManagementController from './user-management.controller';
import { USER_MANAGEMENT_ERRORS } from './user-management.service';

describe('User Management Controller', () => {
	// Create mock functions
	const mockList = fn<
		[{ offset?: number; limit?: number } | undefined, string | undefined],
		Promise<PaginatedResponse<ManagedUserData>>
	>();
	const mockGetById = fn<[number], Promise<ManagedUserData>>();
	const mockCreate = fn<
		[{ email: string; password: string; firstName: string; lastName: string; roleIds?: number[] }],
		Promise<ManagedUserData>
	>();
	const mockUpdate = fn<
		[number, { email?: string; firstName?: string; lastName?: string; enabled?: boolean; roleIds?: number[] }, number],
		Promise<ManagedUserData>
	>();
	const mockDelete = fn<[number], Promise<void>>();
	const mockGetUserPermissions = fn<[number], Promise<PermissionData[]>>();

	let app: Hono;

	const testRole: RoleData = {
		id: 1,
		name: 'Admin',
		code: 'admin',
		description: 'Administrator',
		removable: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	};

	const testManagedUser: ManagedUserData = {
		id: 1,
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		enabled: true,
		deleted: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		roles: [testRole],
	};

	// All admin:users:* permissions for the authenticated user
	const allUserPermissions: PermissionData[] = [
		{ id: 1, name: ADMIN_USER_PERMISSIONS.READ, description: 'Read users', resource: 'users', action: 'read' },
		{ id: 2, name: ADMIN_USER_PERMISSIONS.CREATE, description: 'Create users', resource: 'users', action: 'create' },
		{ id: 3, name: ADMIN_USER_PERMISSIONS.UPDATE, description: 'Update users', resource: 'users', action: 'update' },
		{ id: 4, name: ADMIN_USER_PERMISSIONS.DELETE, description: 'Delete users', resource: 'users', action: 'delete' },
	];

	const ADMIN_USER_ID = 999;

	beforeEach(() => {
		clearAllMocks();

		mockGetUserPermissions.mockResolvedValue(allUserPermissions);

		setTestCradle({
			userManagementService: {
				list: mockList,
				getById: mockGetById,
				create: mockCreate,
				update: mockUpdate,
				delete: mockDelete,
			},
			userRoleService: {
				getUserPermissions: mockGetUserPermissions,
			},
		});

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
		app.route('/users', userManagementController);
	});

	afterEach(() => {
		resetTestCradle();
	});

	describe('GET /users', () => {
		it('should return paginated users', async () => {
			const paginatedResponse: PaginatedResponse<ManagedUserData> = {
				data: [testManagedUser],
				total: 1,
				offset: 0,
				limit: 10,
			};
			mockList.mockResolvedValue(paginatedResponse);

			const res = await app.request('/users');

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(1);
			expect(data.total).toBe(1);
		});

		it('should pass pagination parameters', async () => {
			const paginatedResponse: PaginatedResponse<ManagedUserData> = {
				data: [testManagedUser],
				total: 10,
				offset: 5,
				limit: 5,
			};
			mockList.mockResolvedValue(paginatedResponse);

			const res = await app.request('/users?offset=5&limit=5');

			expect(res.status).toBe(200);
			expect(mockList.calls).toEqual([[{ offset: 5, limit: 5 }, undefined]]);
		});

		it('should pass search parameter', async () => {
			const paginatedResponse: PaginatedResponse<ManagedUserData> = {
				data: [testManagedUser],
				total: 1,
				offset: 0,
				limit: 10,
			};
			mockList.mockResolvedValue(paginatedResponse);

			const res = await app.request('/users?search=test');

			expect(res.status).toBe(200);
			expect(mockList.calls).toEqual([[{ offset: undefined, limit: undefined }, 'test']]);
		});

		it('should validate offset is non-negative', async () => {
			const res = await app.request('/users?offset=-1');
			expect(res.status).toBe(400);
		});

		it('should validate limit max value', async () => {
			const res = await app.request('/users?limit=501');
			expect(res.status).toBe(400);
		});
	});

	describe('GET /users/:id', () => {
		it('should return user when found', async () => {
			mockGetById.mockResolvedValue(testManagedUser);

			const res = await app.request('/users/1');

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.email).toBe('test@example.com');
			expect(data.roles).toHaveLength(1);
		});

		it('should return 404 when user not found', async () => {
			mockGetById.mockRejectedValue(new Error(USER_MANAGEMENT_ERRORS.NOT_FOUND));

			const res = await app.request('/users/999');

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toContain(USER_MANAGEMENT_ERRORS.NOT_FOUND);
		});

		it('should return 400 for invalid ID', async () => {
			const res = await app.request('/users/invalid');

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid user ID');
		});
	});

	describe('POST /users', () => {
		it('should create a new user', async () => {
			mockCreate.mockResolvedValue(testManagedUser);

			const res = await app.request('/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'password123',
					firstName: 'Test',
					lastName: 'User',
					roleIds: [1],
				}),
			});

			expect(res.status).toBe(201);
			const data = await res.json();
			expect(data.email).toBe('test@example.com');
		});

		it('should return 409 when email already exists', async () => {
			mockCreate.mockRejectedValue(new Error(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS));

			const res = await app.request('/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'password123',
					firstName: 'Test',
					lastName: 'User',
				}),
			});

			expect(res.status).toBe(409);
			const data = await res.json();
			expect(data.error).toContain(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS);
		});

		it('should validate required fields', async () => {
			const res = await app.request('/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com',
					// missing password, firstName, lastName
				}),
			});

			expect(res.status).toBe(400);
		});

		it('should validate password minimum length', async () => {
			const res = await app.request('/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'short',
					firstName: 'Test',
					lastName: 'User',
				}),
			});

			expect(res.status).toBe(400);
		});

		it('should validate email format', async () => {
			const res = await app.request('/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'not-an-email',
					password: 'password123',
					firstName: 'Test',
					lastName: 'User',
				}),
			});

			expect(res.status).toBe(400);
		});
	});

	describe('PATCH /users/:id', () => {
		it('should update user details', async () => {
			const updatedUser = { ...testManagedUser, firstName: 'Updated' };
			mockUpdate.mockResolvedValue(updatedUser);

			const res = await app.request('/users/1', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ firstName: 'Updated' }),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.firstName).toBe('Updated');
		});

		it('should return 404 when user not found', async () => {
			mockUpdate.mockRejectedValue(new Error(USER_MANAGEMENT_ERRORS.NOT_FOUND));

			const res = await app.request('/users/999', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ firstName: 'Updated' }),
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toContain(USER_MANAGEMENT_ERRORS.NOT_FOUND);
		});

		it('should return 409 when email already exists', async () => {
			mockUpdate.mockRejectedValue(new Error(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS));

			const res = await app.request('/users/1', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'taken@example.com' }),
			});

			expect(res.status).toBe(409);
			const data = await res.json();
			expect(data.error).toContain(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS);
		});

		it('should return 403 when trying to self-disable', async () => {
			mockUpdate.mockRejectedValue(new Error(USER_MANAGEMENT_ERRORS.SELF_DISABLE));

			const res = await app.request('/users/999', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled: false }),
			});

			expect(res.status).toBe(403);
			const data = await res.json();
			expect(data.error).toContain(USER_MANAGEMENT_ERRORS.SELF_DISABLE);
		});

		it('should return 400 for invalid ID', async () => {
			const res = await app.request('/users/invalid', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ firstName: 'Updated' }),
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid user ID');
		});
	});

	describe('DELETE /users/:id', () => {
		it('should soft delete user successfully', async () => {
			mockDelete.mockResolvedValue(undefined);

			const res = await app.request('/users/1', {
				method: 'DELETE',
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.message).toBe('User deleted successfully');
		});

		it('should return 404 when user not found', async () => {
			mockDelete.mockRejectedValue(new Error(USER_MANAGEMENT_ERRORS.NOT_FOUND));

			const res = await app.request('/users/999', {
				method: 'DELETE',
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toContain(USER_MANAGEMENT_ERRORS.NOT_FOUND);
		});

		it('should return 400 for invalid ID', async () => {
			const res = await app.request('/users/invalid', {
				method: 'DELETE',
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid user ID');
		});
	});
});
