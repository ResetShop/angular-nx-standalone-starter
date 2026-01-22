import { Permission } from '../access/permission.model';
import { Role } from '../access/role.model';
import { User } from './user.model';

describe('User', () => {
	const createTestRoles = () => {
		const adminPermissions = [
			new Permission(1, 'Read Users', null, 'users', 'read'),
			new Permission(2, 'Write Users', null, 'users', 'write'),
		];
		const editorPermissions = [
			new Permission(3, 'Read Posts', null, 'posts', 'read'),
			new Permission(4, 'Write Posts', null, 'posts', 'write'),
		];

		return [
			new Role(1, 'admin', 'Administrator', null, adminPermissions),
			new Role(2, 'editor', 'Editor', null, editorPermissions),
		];
	};

	describe('constructor', () => {
		it('should create a user with all properties', () => {
			const roles = createTestRoles();
			const user = new User(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.id).toBe(1);
			expect(user.email).toBe('john@example.com');
			expect(user.firstName).toBe('John');
			expect(user.lastName).toBe('Doe');
			expect(user.roles).toEqual(roles);
			expect(user.token).toBe('token123');
		});

		it('should allow empty roles array', () => {
			const user = new User(1, 'john@example.com', 'John', 'Doe', [], 'token123');

			expect(user.roles).toEqual([]);
		});
	});

	describe('fullName', () => {
		it('should return firstName and lastName concatenated', () => {
			const user = new User(1, 'john@example.com', 'John', 'Doe', [], 'token123');

			expect(user.fullName).toBe('John Doe');
		});

		it('should handle single-word names', () => {
			const user = new User(1, 'prince@example.com', 'Prince', '', [], 'token123');

			expect(user.fullName).toBe('Prince ');
		});
	});

	describe('permissions', () => {
		it('should aggregate permissions from all roles', () => {
			const roles = createTestRoles();
			const user = new User(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.permissions.length).toBe(4);
		});

		it('should deduplicate permissions across roles', () => {
			const sharedPermission = new Permission(1, 'Read Users', null, 'users', 'read');
			const role1 = new Role(1, 'admin', 'Administrator', null, [sharedPermission]);
			const role2 = new Role(2, 'viewer', 'Viewer', null, [sharedPermission]);

			const user = new User(1, 'john@example.com', 'John', 'Doe', [role1, role2], 'token123');

			expect(user.permissions.length).toBe(1);
			expect(user.permissions[0].identifier).toBe('users:read');
		});

		it('should return empty array for user with no roles', () => {
			const user = new User(1, 'john@example.com', 'John', 'Doe', [], 'token123');

			expect(user.permissions).toEqual([]);
		});
	});

	describe('hasPermission', () => {
		it('should return true when user has permission', () => {
			const roles = createTestRoles();
			const user = new User(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.hasPermission('users', 'read')).toBe(true);
			expect(user.hasPermission('posts', 'write')).toBe(true);
		});

		it('should return false when user does not have permission', () => {
			const roles = createTestRoles();
			const user = new User(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.hasPermission('settings', 'read')).toBe(false);
		});

		it('should return false for user with no roles', () => {
			const user = new User(1, 'john@example.com', 'John', 'Doe', [], 'token123');

			expect(user.hasPermission('users', 'read')).toBe(false);
		});
	});

	describe('hasPermissionByIdentifier', () => {
		it('should return true when user has permission by identifier', () => {
			const roles = createTestRoles();
			const user = new User(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.hasPermissionByIdentifier('users:read')).toBe(true);
			expect(user.hasPermissionByIdentifier('posts:write')).toBe(true);
		});

		it('should return false when user does not have permission', () => {
			const roles = createTestRoles();
			const user = new User(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.hasPermissionByIdentifier('settings:read')).toBe(false);
		});

		it('should return false for user with no roles', () => {
			const user = new User(1, 'john@example.com', 'John', 'Doe', [], 'token123');

			expect(user.hasPermissionByIdentifier('users:read')).toBe(false);
		});
	});

	describe('hasRole', () => {
		it('should return true when user has role', () => {
			const roles = createTestRoles();
			const user = new User(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.hasRole('admin')).toBe(true);
			expect(user.hasRole('editor')).toBe(true);
		});

		it('should return false when user does not have role', () => {
			const roles = createTestRoles();
			const user = new User(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.hasRole('superadmin')).toBe(false);
		});

		it('should return false for user with no roles', () => {
			const user = new User(1, 'john@example.com', 'John', 'Doe', [], 'token123');

			expect(user.hasRole('admin')).toBe(false);
		});
	});
});
