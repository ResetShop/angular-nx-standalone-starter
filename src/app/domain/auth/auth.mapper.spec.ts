import type { LoginResponse, MeResponse } from '@contracts/auth/auth.types';
import type { AuthStorageData } from './auth-storage.type';
import { mapLoginResponseToUser, mapMeResponseToUser, mapStorageDataToUser, mapUserToStorageData } from './auth.mapper';

describe('Auth Mapper', () => {
	describe('mapLoginResponseToUser', () => {
		it('should map LoginResponse to IUser with empty roles', () => {
			const response: LoginResponse = {
				token: 'access-token-123',
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
			expect(user.token).toBe('access-token-123');
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

			const user = mapMeResponseToUser(response, 'token123');

			expect(user.id).toBe(1);
			expect(user.email).toBe('john@example.com');
			expect(user.firstName).toBe('John');
			expect(user.lastName).toBe('Doe');
			expect(user.token).toBe('token123');
			expect(user.roles.length).toBe(1);
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

			const user = mapMeResponseToUser(response, 'token123');

			expect(user.roles).toEqual([]);
		});
	});

	describe('mapStorageDataToUser', () => {
		it('should reconstruct IUser from AuthStorageData', () => {
			const data: AuthStorageData = {
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				token: 'stored-token',
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

			const user = mapStorageDataToUser(data);

			expect(user.id).toBe(1);
			expect(user.email).toBe('john@example.com');
			expect(user.firstName).toBe('John');
			expect(user.lastName).toBe('Doe');
			expect(user.token).toBe('stored-token');
			expect(user.roles.length).toBe(1);
			expect(user.hasPermission('users', 'read')).toBe(true);
		});
	});

	describe('mapUserToStorageData', () => {
		it('should serialize IUser to AuthStorageData', () => {
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
						description: 'Full access',
						permissions: [
							{ id: 1, name: 'Read Users', description: 'Can read users', resource: 'users', action: 'read' },
						],
					},
				],
			};
			const user = mapMeResponseToUser(response, 'token123');

			const storageData = mapUserToStorageData(user);

			expect(storageData.id).toBe(1);
			expect(storageData.email).toBe('john@example.com');
			expect(storageData.firstName).toBe('John');
			expect(storageData.lastName).toBe('Doe');
			expect(storageData.token).toBe('token123');
			expect(storageData.roles.length).toBe(1);
			expect(storageData.roles[0].code).toBe('admin');
			expect(storageData.roles[0].permissions[0].resource).toBe('users');
		});

		it('should produce JSON-serializable output', () => {
			const response: MeResponse = {
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				roles: [],
			};
			const user = mapMeResponseToUser(response, 'token123');

			const storageData = mapUserToStorageData(user);
			const serialized = JSON.stringify(storageData);
			const parsed = JSON.parse(serialized);

			expect(parsed.id).toBe(1);
			expect(parsed.email).toBe('john@example.com');
		});
	});

	describe('round-trip', () => {
		it('should preserve data through mapUserToStorageData and mapStorageDataToUser', () => {
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
			const originalUser = mapMeResponseToUser(response, 'token123');

			const storageData = mapUserToStorageData(originalUser);
			const restoredUser = mapStorageDataToUser(storageData);

			expect(restoredUser.id).toBe(originalUser.id);
			expect(restoredUser.email).toBe(originalUser.email);
			expect(restoredUser.firstName).toBe(originalUser.firstName);
			expect(restoredUser.lastName).toBe(originalUser.lastName);
			expect(restoredUser.token).toBe(originalUser.token);
			expect(restoredUser.roles.length).toBe(originalUser.roles.length);
			expect(restoredUser.hasPermission('users', 'read')).toBe(true);
		});
	});
});
