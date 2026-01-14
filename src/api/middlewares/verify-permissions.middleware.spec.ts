import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearAllMocks, fn, resetTestCradle, setTestCradle } from '../container.mock';
import type { PermissionData } from '../modules/user-role/interfaces';
import {
	permission,
	requireAllPermissions,
	requireAnyPermission,
	requirePermission,
} from './verify-permissions.middleware';

describe('permission helper', () => {
	it('should accept valid snake_case permission names', () => {
		expect(() => permission('can_create_users')).not.toThrow();
		expect(() => permission('view_reports')).not.toThrow();
		expect(() => permission('admin')).not.toThrow();
		expect(() => permission('a')).not.toThrow();
		expect(() => permission('can_do_something_123')).not.toThrow();
	});

	it('should reject permission names starting with uppercase', () => {
		expect(() => permission('Can_create_users')).toThrow(/Invalid permission name/);
		expect(() => permission('ADMIN')).toThrow(/Invalid permission name/);
	});

	it('should reject permission names starting with numbers', () => {
		expect(() => permission('123_permission')).toThrow(/Invalid permission name/);
	});

	it('should reject permission names with invalid characters', () => {
		expect(() => permission('can-create-users')).toThrow(/Invalid permission name/);
		expect(() => permission('can create users')).toThrow(/Invalid permission name/);
		expect(() => permission('can.create.users')).toThrow(/Invalid permission name/);
	});

	it('should reject empty strings', () => {
		expect(() => permission('')).toThrow(/Invalid permission name/);
	});
});

describe('Permissions Middleware', () => {
	// Mock functions
	const mockGetUserPermissions = fn<[number], Promise<PermissionData[]>>();

	// Test permissions
	const testPermissions: PermissionData[] = [
		{ id: 1, name: 'can_create_users', description: 'Create users', resource: 'users', action: 'create' },
		{ id: 2, name: 'can_delete_users', description: 'Delete users', resource: 'users', action: 'delete' },
	];

	beforeEach(() => {
		clearAllMocks();
		setTestCradle({
			userRoleService: {
				getUserPermissions: mockGetUserPermissions,
			},
		});
	});

	afterEach(() => {
		resetTestCradle();
	});

	describe('requirePermission', () => {
		it('should return 401 if user is not authenticated', async () => {
			const app = new Hono();
			app.use('*', requirePermission(permission('can_create_users')));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(401);
			const data = await res.json();
			expect(data.error).toBe('Unauthorized');
		});

		it('should return 403 if user does not have the required permission', async () => {
			mockGetUserPermissions.mockResolvedValue([]);

			const app = new Hono();
			// Simulate authenticated user
			app.use('*', async (c, next) => {
				(c as any).user = { sub: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
				await next();
			});
			app.use('*', requirePermission(permission('can_create_users')));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(403);
			const data = await res.json();
			expect(data.error).toBe('Forbidden');
		});

		it('should allow access if user has the required permission', async () => {
			mockGetUserPermissions.mockResolvedValue(testPermissions);

			const app = new Hono();
			app.use('*', async (c, next) => {
				(c as any).user = { sub: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
				await next();
			});
			app.use('*', requirePermission(permission('can_create_users')));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.success).toBe(true);
		});

		it('should cache permissions for subsequent middleware calls', async () => {
			mockGetUserPermissions.mockResolvedValue(testPermissions);

			const app = new Hono();
			app.use('*', async (c, next) => {
				(c as any).user = { sub: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
				await next();
			});
			app.use('*', requirePermission(permission('can_create_users')));
			app.use('*', requirePermission(permission('can_delete_users')));
			app.get('/test', (c) => c.json({ success: true }));

			await app.request('/test');

			// Should only call getUserPermissions once due to caching
			expect(mockGetUserPermissions.calls).toHaveLength(1);
		});

		it('should return 403 if getUserPermissions throws an error', async () => {
			mockGetUserPermissions.mockRejectedValue(new Error('User not found'));

			const app = new Hono();
			app.use('*', async (c, next) => {
				(c as any).user = { sub: '999', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
				await next();
			});
			app.use('*', requirePermission(permission('can_create_users')));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(403);
			const data = await res.json();
			expect(data.error).toBe('Forbidden');
		});
	});

	describe('requireAnyPermission', () => {
		it('should return 401 if user is not authenticated', async () => {
			const app = new Hono();
			app.use('*', requireAnyPermission([permission('can_create_users'), permission('can_delete_users')]));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(401);
		});

		it('should return 403 if user has none of the required permissions', async () => {
			mockGetUserPermissions.mockResolvedValue([]);

			const app = new Hono();
			app.use('*', async (c, next) => {
				(c as any).user = { sub: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
				await next();
			});
			app.use('*', requireAnyPermission([permission('can_create_users'), permission('can_delete_users')]));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(403);
		});

		it('should allow access if user has at least one of the required permissions', async () => {
			mockGetUserPermissions.mockResolvedValue([testPermissions[0]]); // Only can_create_users

			const app = new Hono();
			app.use('*', async (c, next) => {
				(c as any).user = { sub: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
				await next();
			});
			app.use('*', requireAnyPermission([permission('can_create_users'), permission('can_delete_users')]));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(200);
		});
	});

	describe('requireAllPermissions', () => {
		it('should return 401 if user is not authenticated', async () => {
			const app = new Hono();
			app.use('*', requireAllPermissions([permission('can_create_users'), permission('can_delete_users')]));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(401);
		});

		it('should return 403 if user is missing any required permission', async () => {
			mockGetUserPermissions.mockResolvedValue([testPermissions[0]]); // Only can_create_users

			const app = new Hono();
			app.use('*', async (c, next) => {
				(c as any).user = { sub: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
				await next();
			});
			app.use('*', requireAllPermissions([permission('can_create_users'), permission('can_delete_users')]));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(403);
		});

		it('should allow access if user has all required permissions', async () => {
			mockGetUserPermissions.mockResolvedValue(testPermissions);

			const app = new Hono();
			app.use('*', async (c, next) => {
				(c as any).user = { sub: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
				await next();
			});
			app.use('*', requireAllPermissions([permission('can_create_users'), permission('can_delete_users')]));
			app.get('/test', (c) => c.json({ success: true }));

			const res = await app.request('/test');

			expect(res.status).toBe(200);
		});
	});
});
