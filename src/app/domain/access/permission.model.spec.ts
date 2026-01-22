import { Permission } from './permission.model';

describe('Permission', () => {
	describe('constructor', () => {
		it('should create a permission with all properties', () => {
			const permission = new Permission(1, 'Read Users', 'Can read user data', 'users', 'read');

			expect(permission.id).toBe(1);
			expect(permission.name).toBe('Read Users');
			expect(permission.description).toBe('Can read user data');
			expect(permission.resource).toBe('users');
			expect(permission.action).toBe('read');
		});

		it('should allow null description', () => {
			const permission = new Permission(1, 'Read Users', null, 'users', 'read');

			expect(permission.description).toBeNull();
		});
	});

	describe('identifier', () => {
		it('should return resource:action format', () => {
			const permission = new Permission(1, 'Read Users', null, 'users', 'read');

			expect(permission.identifier).toBe('users:read');
		});

		it('should handle different resource and action combinations', () => {
			const permission1 = new Permission(1, 'Create Roles', null, 'roles', 'create');
			const permission2 = new Permission(2, 'Delete Posts', null, 'posts', 'delete');

			expect(permission1.identifier).toBe('roles:create');
			expect(permission2.identifier).toBe('posts:delete');
		});
	});

	describe('matches', () => {
		it('should return true when resource and action match', () => {
			const permission = new Permission(1, 'Read Users', null, 'users', 'read');

			expect(permission.matches('users', 'read')).toBe(true);
		});

		it('should return false when resource does not match', () => {
			const permission = new Permission(1, 'Read Users', null, 'users', 'read');

			expect(permission.matches('roles', 'read')).toBe(false);
		});

		it('should return false when action does not match', () => {
			const permission = new Permission(1, 'Read Users', null, 'users', 'read');

			expect(permission.matches('users', 'write')).toBe(false);
		});

		it('should return false when neither resource nor action match', () => {
			const permission = new Permission(1, 'Read Users', null, 'users', 'read');

			expect(permission.matches('roles', 'write')).toBe(false);
		});
	});
});
