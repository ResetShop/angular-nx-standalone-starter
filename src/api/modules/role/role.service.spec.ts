import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PermissionData, RoleData } from './interfaces';
import { MockRoleRepository } from './role.repository.mock';
import { ROLE_ERRORS, RoleService } from './role.service';

describe('RoleService', () => {
	let roleService: RoleService;
	let mockRoleRepo: MockRoleRepository;

	// Test data
	const testRole: RoleData = {
		id: 1,
		name: 'Administrator',
		code: 'admin',
		description: 'System administrator',
		removable: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const removableRole: RoleData = {
		id: 2,
		name: 'Editor',
		code: 'editor',
		description: 'Content editor',
		removable: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const testPermissions: PermissionData[] = [
		{ id: 1, name: 'can_create_users', description: 'Create users', resource: 'users', action: 'create' },
		{ id: 2, name: 'can_delete_users', description: 'Delete users', resource: 'users', action: 'delete' },
	];

	beforeEach(() => {
		mockRoleRepo = new MockRoleRepository();
		roleService = new RoleService({ roleRepository: mockRoleRepo });
	});

	afterEach(() => {
		mockRoleRepo.clear();
	});

	describe('getRole', () => {
		it('should return role when found', async () => {
			mockRoleRepo.addRole(testRole);

			const result = await roleService.getRole(testRole.id);

			expect(result).toEqual(testRole);
		});

		it('should return null when role not found', async () => {
			const result = await roleService.getRole(999);

			expect(result).toBeNull();
		});
	});

	describe('getRoleByCode', () => {
		it('should return role when found by code', async () => {
			mockRoleRepo.addRole(testRole);

			const result = await roleService.getRoleByCode(testRole.code);

			expect(result).toEqual(testRole);
		});

		it('should return null when role not found by code', async () => {
			const result = await roleService.getRoleByCode('nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getAllRoles', () => {
		it('should return paginated roles', async () => {
			mockRoleRepo.addRole(testRole);
			mockRoleRepo.addRole(removableRole);

			const result = await roleService.getAllRoles();

			expect(result.data).toHaveLength(2);
			expect(result.total).toBe(2);
			expect(result.offset).toBe(0);
			expect(result.limit).toBe(10);
		});

		it('should respect pagination parameters', async () => {
			mockRoleRepo.addRole(testRole);
			mockRoleRepo.addRole(removableRole);

			const result = await roleService.getAllRoles({ offset: 1, limit: 1 });

			expect(result.data).toHaveLength(1);
			expect(result.total).toBe(2);
			expect(result.offset).toBe(1);
			expect(result.limit).toBe(1);
		});

		it('should return empty data when offset exceeds total', async () => {
			mockRoleRepo.addRole(testRole);

			const result = await roleService.getAllRoles({ offset: 10, limit: 10 });

			expect(result.data).toHaveLength(0);
			expect(result.total).toBe(1);
		});
	});

	describe('createRole', () => {
		it('should create a new role', async () => {
			const params = {
				name: 'New Role',
				code: 'new_role',
				description: 'A new role',
			};

			const result = await roleService.createRole(params);

			expect(result.name).toBe(params.name);
			expect(result.code).toBe(params.code);
			expect(result.description).toBe(params.description);
			expect(result.removable).toBe(true);
		});

		it('should throw CODE_EXISTS when code already exists', async () => {
			mockRoleRepo.addRole(testRole);

			await expect(
				roleService.createRole({
					name: 'Another Admin',
					code: testRole.code,
				}),
			).rejects.toThrow(ROLE_ERRORS.CODE_EXISTS);
		});

		it('should throw NAME_EXISTS when name already exists', async () => {
			mockRoleRepo.addRole(testRole);

			await expect(
				roleService.createRole({
					name: testRole.name,
					code: 'different_code',
				}),
			).rejects.toThrow(ROLE_ERRORS.NAME_EXISTS);
		});

		it('should create role without description', async () => {
			const params = {
				name: 'Minimal Role',
				code: 'minimal_role',
			};

			const result = await roleService.createRole(params);

			expect(result.name).toBe(params.name);
			expect(result.description).toBeNull();
		});
	});

	describe('updateRole', () => {
		it('should update role description', async () => {
			mockRoleRepo.addRole(testRole);

			const result = await roleService.updateRole(testRole.id, {
				description: 'Updated description',
			});

			expect(result.description).toBe('Updated description');
		});

		it('should update role name', async () => {
			mockRoleRepo.addRole(removableRole);

			const result = await roleService.updateRole(removableRole.id, {
				name: 'Updated Name',
			});

			expect(result.name).toBe('Updated Name');
		});

		it('should throw NOT_FOUND when role does not exist', async () => {
			await expect(
				roleService.updateRole(999, {
					description: 'New description',
				}),
			).rejects.toThrow(ROLE_ERRORS.NOT_FOUND);
		});

		it('should throw NAME_EXISTS when updating to existing name', async () => {
			mockRoleRepo.addRole(testRole);
			mockRoleRepo.addRole(removableRole);

			await expect(
				roleService.updateRole(removableRole.id, {
					name: testRole.name,
				}),
			).rejects.toThrow(ROLE_ERRORS.NAME_EXISTS);
		});

		it('should allow updating to same name (no change)', async () => {
			mockRoleRepo.addRole(testRole);

			const result = await roleService.updateRole(testRole.id, {
				name: testRole.name,
				description: 'New description',
			});

			expect(result.name).toBe(testRole.name);
			expect(result.description).toBe('New description');
		});
	});

	describe('deleteRole', () => {
		it('should delete removable role', async () => {
			mockRoleRepo.addRole(removableRole);

			await roleService.deleteRole(removableRole.id);

			const result = await roleService.getRole(removableRole.id);
			expect(result).toBeNull();
		});

		it('should throw NOT_FOUND when role does not exist', async () => {
			await expect(roleService.deleteRole(999)).rejects.toThrow(ROLE_ERRORS.NOT_FOUND);
		});

		it('should throw NOT_REMOVABLE when role is not removable', async () => {
			mockRoleRepo.addRole(testRole); // testRole has removable: false

			await expect(roleService.deleteRole(testRole.id)).rejects.toThrow(ROLE_ERRORS.NOT_REMOVABLE);
		});
	});

	describe('getRolePermissions', () => {
		it('should return paginated permissions for role', async () => {
			mockRoleRepo.addRole(testRole);
			mockRoleRepo.addPermissionsForRole(testRole.id, testPermissions);

			const result = await roleService.getRolePermissions(testRole.id);

			expect(result.data).toHaveLength(2);
			expect(result.total).toBe(2);
			expect(result.data[0].name).toBe('can_create_users');
		});

		it('should throw NOT_FOUND when role does not exist', async () => {
			await expect(roleService.getRolePermissions(999)).rejects.toThrow(ROLE_ERRORS.NOT_FOUND);
		});

		it('should return empty permissions when role has none', async () => {
			mockRoleRepo.addRole(testRole);

			const result = await roleService.getRolePermissions(testRole.id);

			expect(result.data).toHaveLength(0);
			expect(result.total).toBe(0);
		});

		it('should respect pagination parameters', async () => {
			mockRoleRepo.addRole(testRole);
			mockRoleRepo.addPermissionsForRole(testRole.id, testPermissions);

			const result = await roleService.getRolePermissions(testRole.id, { offset: 1, limit: 1 });

			expect(result.data).toHaveLength(1);
			expect(result.total).toBe(2);
			expect(result.offset).toBe(1);
			expect(result.limit).toBe(1);
		});
	});

	describe('assignPermissionsToRole', () => {
		it('should assign permissions to role', async () => {
			mockRoleRepo.addRole(testRole);

			await roleService.assignPermissionsToRole(testRole.id, [1, 2, 3]);

			const result = await roleService.getRolePermissions(testRole.id);
			expect(result.data).toHaveLength(3);
		});

		it('should throw NOT_FOUND when role does not exist', async () => {
			await expect(roleService.assignPermissionsToRole(999, [1, 2])).rejects.toThrow(ROLE_ERRORS.NOT_FOUND);
		});

		it('should replace existing permissions', async () => {
			mockRoleRepo.addRole(testRole);
			mockRoleRepo.addPermissionsForRole(testRole.id, testPermissions);

			await roleService.assignPermissionsToRole(testRole.id, [5]);

			const result = await roleService.getRolePermissions(testRole.id);
			expect(result.data).toHaveLength(1);
			expect(result.data[0].id).toBe(5);
		});
	});
});
