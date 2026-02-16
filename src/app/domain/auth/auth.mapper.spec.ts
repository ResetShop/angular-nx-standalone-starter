import type { LoginResponse, MeResponse } from '@contracts/auth/auth.types';
import { mapLoginResponseToUser, mapMeResponseToUser } from './auth.mapper';

describe('Auth Mapper', () => {
	describe('mapLoginResponseToUser', () => {
		it('should map LoginResponse to IUser with empty roles', () => {
			const response: LoginResponse = {
				user: {
					id: 1,
					email: 'john@example.com',
					firstName: 'John',
					lastName: 'Doe',
				},
			};

			const user = mapLoginResponseToUser(response);

			expect(user.id).toBe(1);
			expect(user.email).toBe('john@example.com');
			expect(user.firstName).toBe('John');
			expect(user.lastName).toBe('Doe');
			expect(user.roles).toEqual([]);
		});
	});

	describe('mapMeResponseToUser', () => {
		it('should map MeResponse to IUser with roles', () => {
			const response: MeResponse = {
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				roles: [
					{
						id: 1,
						code: 'admin',
						name: 'Administrator',
						description: null,
						permissions: [{ id: 1, name: 'Read Users', description: null, resource: 'users', action: 'read' }],
					},
				],
			};

			const user = mapMeResponseToUser(response);

			expect(user.id).toBe(1);
			expect(user.email).toBe('john@example.com');
			expect(user.firstName).toBe('John');
			expect(user.lastName).toBe('Doe');
			expect(user.roles).toHaveLength(1);
			expect(user.roles[0].code).toBe('admin');
			expect(user.hasPermission('users', 'read')).toBe(true);
		});

		it('should handle empty roles', () => {
			const response: MeResponse = {
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				roles: [],
			};

			const user = mapMeResponseToUser(response);

			expect(user.roles).toEqual([]);
		});
	});
});
