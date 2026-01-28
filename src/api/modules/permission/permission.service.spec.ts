import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PermissionData } from '../role/interfaces';
import { MockPermissionRepository } from './permission.repository.mock';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
	let permissionService: PermissionService;
	let mockPermissionRepo: MockPermissionRepository;

	const testPermissions: PermissionData[] = [
		{ id: 1, name: 'admin:users:create', description: 'Create users', resource: 'users', action: 'create' },
		{ id: 2, name: 'admin:users:read', description: 'View users', resource: 'users', action: 'read' },
		{ id: 3, name: 'admin:roles:create', description: 'Create roles', resource: 'roles', action: 'create' },
		{ id: 4, name: 'admin:roles:read', description: 'View roles', resource: 'roles', action: 'read' },
	];

	beforeEach(() => {
		mockPermissionRepo = new MockPermissionRepository();
		permissionService = new PermissionService({ permissionRepository: mockPermissionRepo });
	});

	afterEach(() => {
		mockPermissionRepo.clear();
	});

	describe('list', () => {
		it('should return paginated permissions', async () => {
			testPermissions.forEach((p) => mockPermissionRepo.addPermission(p));

			const result = await permissionService.list();

			expect(result.data).toHaveLength(4);
			expect(result.total).toBe(4);
			expect(result.offset).toBe(0);
			expect(result.limit).toBe(10);
		});

		it('should respect pagination parameters', async () => {
			testPermissions.forEach((p) => mockPermissionRepo.addPermission(p));

			const result = await permissionService.list({ offset: 1, limit: 2 });

			expect(result.data).toHaveLength(2);
			expect(result.total).toBe(4);
			expect(result.offset).toBe(1);
			expect(result.limit).toBe(2);
		});

		it('should return empty data when offset exceeds total', async () => {
			testPermissions.forEach((p) => mockPermissionRepo.addPermission(p));

			const result = await permissionService.list({ offset: 10, limit: 10 });

			expect(result.data).toHaveLength(0);
			expect(result.total).toBe(4);
		});

		it('should return empty data when no permissions exist', async () => {
			const result = await permissionService.list();

			expect(result.data).toHaveLength(0);
			expect(result.total).toBe(0);
		});
	});
});
