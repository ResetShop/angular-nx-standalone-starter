import { Permission } from '../access/permission.model';
import { Role } from '../access/role.model';
import { createUser } from './user.mapper';

describe('User Mapper', () => {
	describe('createUser', () => {
		it('should create a User instance with all properties', () => {
			const roles = [new Role(1, 'admin', 'Administrator', null, [])];
			const user = createUser(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.id).toBe(1);
			expect(user.email).toBe('john@example.com');
			expect(user.firstName).toBe('John');
			expect(user.lastName).toBe('Doe');
			expect(user.roles).toEqual(roles);
			expect(user.token).toBe('token123');
		});

		it('should create user with working fullName getter', () => {
			const user = createUser(1, 'john@example.com', 'John', 'Doe', [], 'token123');

			expect(user.fullName).toBe('John Doe');
		});

		it('should create user with aggregated permissions', () => {
			const permissions = [new Permission(1, 'Read Users', null, 'users', 'read')];
			const roles = [new Role(1, 'admin', 'Administrator', null, permissions)];
			const user = createUser(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.permissions.length).toBe(1);
			expect(user.hasPermission('users', 'read')).toBe(true);
		});

		it('should create user with working hasRole method', () => {
			const roles = [new Role(1, 'admin', 'Administrator', null, [])];
			const user = createUser(1, 'john@example.com', 'John', 'Doe', roles, 'token123');

			expect(user.hasRole('admin')).toBe(true);
			expect(user.hasRole('guest')).toBe(false);
		});

		it('should handle empty roles', () => {
			const user = createUser(1, 'john@example.com', 'John', 'Doe', [], 'token123');

			expect(user.roles).toEqual([]);
			expect(user.permissions).toEqual([]);
		});
	});
});
