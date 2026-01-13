import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaginatedResponse, PermissionData, RoleData } from './interfaces';
import { ROLE_ERRORS } from './role.service';

// Create mock functions
const mockGetAllRoles = vi.fn();
const mockGetRole = vi.fn();
const mockCreateRole = vi.fn();
const mockUpdateRole = vi.fn();
const mockDeleteRole = vi.fn();
const mockGetRolePermissions = vi.fn();
const mockAssignPermissionsToRole = vi.fn();

// Mock the container
vi.mock('../../container', () => {
	return {
		container: {
			cradle: {
				get roleService() {
					return {
						getAllRoles: mockGetAllRoles,
						getRole: mockGetRole,
						createRole: mockCreateRole,
						updateRole: mockUpdateRole,
						deleteRole: mockDeleteRole,
						getRolePermissions: mockGetRolePermissions,
						assignPermissionsToRole: mockAssignPermissionsToRole,
					};
				},
			},
		},
	};
});

// Import controller after mocking
import roleController from './role.controller';

describe('Role Controller', () => {
	const app = new Hono();
	app.route('/roles', roleController);

	// Test data
	const testRole: RoleData = {
		id: 1,
		name: 'Administrator',
		code: 'admin',
		description: 'System administrator',
		removable: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	};

	const testPermissions: PermissionData[] = [
		{ id: 1, name: 'can_create_users', description: 'Create users', resource: 'users', action: 'create' },
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /roles', () => {
		it('should return paginated roles', async () => {
			const paginatedResponse: PaginatedResponse<RoleData> = {
				data: [testRole],
				total: 1,
				offset: 0,
				limit: 10,
			};
			mockGetAllRoles.mockResolvedValue(paginatedResponse);

			const res = await app.request('/roles');

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(1);
			expect(data.total).toBe(1);
			expect(mockGetAllRoles).toHaveBeenCalledWith({ offset: undefined, limit: undefined });
		});

		it('should pass pagination parameters', async () => {
			const paginatedResponse: PaginatedResponse<RoleData> = {
				data: [testRole],
				total: 10,
				offset: 5,
				limit: 5,
			};
			mockGetAllRoles.mockResolvedValue(paginatedResponse);

			const res = await app.request('/roles?offset=5&limit=5');

			expect(res.status).toBe(200);
			expect(mockGetAllRoles).toHaveBeenCalledWith({ offset: 5, limit: 5 });
		});

		it('should validate offset is non-negative', async () => {
			const res = await app.request('/roles?offset=-1');

			expect(res.status).toBe(400);
		});

		it('should validate limit is positive', async () => {
			const res = await app.request('/roles?limit=0');

			expect(res.status).toBe(400);
		});

		it('should validate limit max value', async () => {
			const res = await app.request('/roles?limit=101');

			expect(res.status).toBe(400);
		});
	});

	describe('GET /roles/:id', () => {
		it('should return role when found', async () => {
			mockGetRole.mockResolvedValue(testRole);

			const res = await app.request('/roles/1');

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.code).toBe('admin');
		});

		it('should return 404 when role not found', async () => {
			mockGetRole.mockResolvedValue(null);

			const res = await app.request('/roles/999');

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(ROLE_ERRORS.NOT_FOUND);
		});

		it('should return 400 for invalid ID', async () => {
			const res = await app.request('/roles/invalid');

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid role ID');
		});
	});

	describe('POST /roles', () => {
		it('should create a new role', async () => {
			const newRole = { ...testRole, id: 2, code: 'editor', name: 'Editor' };
			mockCreateRole.mockResolvedValue(newRole);

			const res = await app.request('/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Editor',
					code: 'editor',
					description: 'Content editor',
				}),
			});

			expect(res.status).toBe(201);
			const data = await res.json();
			expect(data.code).toBe('editor');
		});

		it('should return 409 when code already exists', async () => {
			mockCreateRole.mockRejectedValue(new Error(ROLE_ERRORS.CODE_EXISTS));

			const res = await app.request('/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Admin',
					code: 'admin',
				}),
			});

			expect(res.status).toBe(409);
			const data = await res.json();
			expect(data.error).toBe(ROLE_ERRORS.CODE_EXISTS);
		});

		it('should validate required fields', async () => {
			const res = await app.request('/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Test',
					// missing code
				}),
			});

			expect(res.status).toBe(400);
		});

		it('should validate code format', async () => {
			const res = await app.request('/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Test',
					code: 'Invalid-Code', // uppercase and hyphen not allowed
				}),
			});

			expect(res.status).toBe(400);
		});

		it('should allow code starting with letter and containing underscores', async () => {
			mockCreateRole.mockResolvedValue({ ...testRole, code: 'my_role_123' });

			const res = await app.request('/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'My Role',
					code: 'my_role_123',
				}),
			});

			expect(res.status).toBe(201);
		});
	});

	describe('PUT /roles/:id', () => {
		it('should update role description', async () => {
			const updatedRole = { ...testRole, description: 'Updated description' };
			mockUpdateRole.mockResolvedValue(updatedRole);

			const res = await app.request('/roles/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					description: 'Updated description',
				}),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.description).toBe('Updated description');
		});

		it('should return 404 when role not found', async () => {
			mockUpdateRole.mockRejectedValue(new Error(ROLE_ERRORS.NOT_FOUND));

			const res = await app.request('/roles/999', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					description: 'New description',
				}),
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(ROLE_ERRORS.NOT_FOUND);
		});

		it('should return 400 for invalid ID', async () => {
			const res = await app.request('/roles/invalid', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					description: 'New description',
				}),
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid role ID');
		});

		it('should validate description max length', async () => {
			const res = await app.request('/roles/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					description: 'x'.repeat(501),
				}),
			});

			expect(res.status).toBe(400);
		});
	});

	describe('DELETE /roles/:id', () => {
		it('should delete role successfully', async () => {
			mockDeleteRole.mockResolvedValue(undefined);

			const res = await app.request('/roles/2', {
				method: 'DELETE',
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.message).toBe('Role deleted successfully');
		});

		it('should return 404 when role not found', async () => {
			mockDeleteRole.mockRejectedValue(new Error(ROLE_ERRORS.NOT_FOUND));

			const res = await app.request('/roles/999', {
				method: 'DELETE',
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(ROLE_ERRORS.NOT_FOUND);
		});

		it('should return 403 when role is not removable', async () => {
			mockDeleteRole.mockRejectedValue(new Error(ROLE_ERRORS.NOT_REMOVABLE));

			const res = await app.request('/roles/1', {
				method: 'DELETE',
			});

			expect(res.status).toBe(403);
			const data = await res.json();
			expect(data.error).toBe(ROLE_ERRORS.NOT_REMOVABLE);
		});

		it('should return 400 for invalid ID', async () => {
			const res = await app.request('/roles/invalid', {
				method: 'DELETE',
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid role ID');
		});
	});

	describe('GET /roles/:id/permissions', () => {
		it('should return paginated permissions', async () => {
			const paginatedResponse: PaginatedResponse<PermissionData> = {
				data: testPermissions,
				total: 1,
				offset: 0,
				limit: 10,
			};
			mockGetRolePermissions.mockResolvedValue(paginatedResponse);

			const res = await app.request('/roles/1/permissions');

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.data).toHaveLength(1);
			expect(data.total).toBe(1);
		});

		it('should pass pagination parameters', async () => {
			const paginatedResponse: PaginatedResponse<PermissionData> = {
				data: testPermissions,
				total: 10,
				offset: 5,
				limit: 5,
			};
			mockGetRolePermissions.mockResolvedValue(paginatedResponse);

			const res = await app.request('/roles/1/permissions?offset=5&limit=5');

			expect(res.status).toBe(200);
			expect(mockGetRolePermissions).toHaveBeenCalledWith(1, { offset: 5, limit: 5 });
		});

		it('should return 404 when role not found', async () => {
			mockGetRolePermissions.mockRejectedValue(new Error(ROLE_ERRORS.NOT_FOUND));

			const res = await app.request('/roles/999/permissions');

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(ROLE_ERRORS.NOT_FOUND);
		});

		it('should return 400 for invalid ID', async () => {
			const res = await app.request('/roles/invalid/permissions');

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid role ID');
		});
	});

	describe('POST /roles/:id/permissions', () => {
		it('should assign permissions to role', async () => {
			mockAssignPermissionsToRole.mockResolvedValue(undefined);

			const res = await app.request('/roles/1/permissions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					permissionIds: [1, 2, 3],
				}),
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.message).toBe('Permissions assigned successfully');
			expect(mockAssignPermissionsToRole).toHaveBeenCalledWith(1, [1, 2, 3]);
		});

		it('should return 404 when role not found', async () => {
			mockAssignPermissionsToRole.mockRejectedValue(new Error(ROLE_ERRORS.NOT_FOUND));

			const res = await app.request('/roles/999/permissions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					permissionIds: [1],
				}),
			});

			expect(res.status).toBe(404);
			const data = await res.json();
			expect(data.error).toBe(ROLE_ERRORS.NOT_FOUND);
		});

		it('should return 400 for invalid ID', async () => {
			const res = await app.request('/roles/invalid/permissions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					permissionIds: [1],
				}),
			});

			expect(res.status).toBe(400);
			const data = await res.json();
			expect(data.error).toBe('Invalid role ID');
		});

		it('should validate permissionIds is an array of positive integers', async () => {
			const res = await app.request('/roles/1/permissions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					permissionIds: [-1, 0],
				}),
			});

			expect(res.status).toBe(400);
		});

		it('should validate permissionIds is required', async () => {
			const res = await app.request('/roles/1/permissions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			expect(res.status).toBe(400);
		});
	});
});
