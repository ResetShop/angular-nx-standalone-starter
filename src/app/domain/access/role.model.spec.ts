import { Permission } from './permission.model';
import { Role } from './role.model';

describe('Role', () => {
	const createTestPermissions = () => [
		new Permission(1, 'Read Users', null, 'users', 'read'),
		new Permission(2, 'Write Users', null, 'users', 'write'),
		new Permission(3, 'Read Roles', null, 'roles', 'read'),
	];

	describe('constructor', () => {
		it('should create a role with all properties', () => {
			const permissions = createTestPermissions();
			const role = new Role(1, 'admin', 'Administrator', 'Full access', permissions);

			expect(role.id).toBe(1);
			expect(role.code).toBe('admin');
			expect(role.name).toBe('Administrator');
			expect(role.description).toBe('Full access');
			expect(role.permissions).toEqual(permissions);
		});

		it('should allow null description', () => {
			const role = new Role(1, 'admin', 'Administrator', null, []);

			expect(role.description).toBeNull();
		});

		it('should allow empty permissions array', () => {
			const role = new Role(1, 'guest', 'Guest', null, []);

			expect(role.permissions).toEqual([]);
		});
	});

	describe('hasPermission', () => {
		it('should return true when permission exists', () => {
			const permissions = createTestPermissions();
			const role = new Role(1, 'admin', 'Administrator', null, permissions);

			expect(role.hasPermission('users', 'read')).toBe(true);
			expect(role.hasPermission('users', 'write')).toBe(true);
			expect(role.hasPermission('roles', 'read')).toBe(true);
		});

		it('should return false when permission does not exist', () => {
			const permissions = createTestPermissions();
			const role = new Role(1, 'admin', 'Administrator', null, permissions);

			expect(role.hasPermission('roles', 'write')).toBe(false);
			expect(role.hasPermission('posts', 'read')).toBe(false);
		});

		it('should return false for empty permissions', () => {
			const role = new Role(1, 'guest', 'Guest', null, []);

			expect(role.hasPermission('users', 'read')).toBe(false);
		});
	});

	describe('hasPermissionByIdentifier', () => {
		it('should return true when permission identifier exists', () => {
			const permissions = createTestPermissions();
			const role = new Role(1, 'admin', 'Administrator', null, permissions);

			expect(role.hasPermissionByIdentifier('users:read')).toBe(true);
			expect(role.hasPermissionByIdentifier('users:write')).toBe(true);
			expect(role.hasPermissionByIdentifier('roles:read')).toBe(true);
		});

		it('should return false when permission identifier does not exist', () => {
			const permissions = createTestPermissions();
			const role = new Role(1, 'admin', 'Administrator', null, permissions);

			expect(role.hasPermissionByIdentifier('roles:write')).toBe(false);
			expect(role.hasPermissionByIdentifier('posts:read')).toBe(false);
		});

		it('should return false for empty permissions', () => {
			const role = new Role(1, 'guest', 'Guest', null, []);

			expect(role.hasPermissionByIdentifier('users:read')).toBe(false);
		});
	});
});
