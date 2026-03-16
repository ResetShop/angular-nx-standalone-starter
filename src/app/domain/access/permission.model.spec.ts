import { createPermission } from './permission.mapper'

describe('Permission', () => {
	describe('createPermission', () => {
		it('should create a permission with all properties', () => {
			const permission = createPermission({
				id: 1,
				name: 'Read Users',
				description: 'Can read user data',
				resource: 'users',
				action: 'read',
			})

			expect(permission.id).toBe(1)
			expect(permission.name).toBe('Read Users')
			expect(permission.description).toBe('Can read user data')
			expect(permission.resource).toBe('users')
			expect(permission.action).toBe('read')
		})

		it('should allow null description', () => {
			const permission = createPermission({
				id: 1,
				name: 'Read Users',
				description: null,
				resource: 'users',
				action: 'read',
			})

			expect(permission.description).toBeNull()
		})
	})

	describe('identifier', () => {
		it('should return resource:action format', () => {
			const permission = createPermission({
				id: 1,
				name: 'Read Users',
				description: null,
				resource: 'users',
				action: 'read',
			})

			expect(permission.identifier).toBe('users:read')
		})

		it('should handle different resource and action combinations', () => {
			const permission1 = createPermission({
				id: 1,
				name: 'Create Roles',
				description: null,
				resource: 'roles',
				action: 'create',
			})
			const permission2 = createPermission({
				id: 2,
				name: 'Delete Posts',
				description: null,
				resource: 'posts',
				action: 'delete',
			})

			expect(permission1.identifier).toBe('roles:create')
			expect(permission2.identifier).toBe('posts:delete')
		})
	})

	describe('matches', () => {
		it('should return true when resource and action match', () => {
			const permission = createPermission({
				id: 1,
				name: 'Read Users',
				description: null,
				resource: 'users',
				action: 'read',
			})

			expect(permission.matches('users', 'read')).toBe(true)
		})

		it('should return false when resource does not match', () => {
			const permission = createPermission({
				id: 1,
				name: 'Read Users',
				description: null,
				resource: 'users',
				action: 'read',
			})

			expect(permission.matches('roles', 'read')).toBe(false)
		})

		it('should return false when action does not match', () => {
			const permission = createPermission({
				id: 1,
				name: 'Read Users',
				description: null,
				resource: 'users',
				action: 'read',
			})

			expect(permission.matches('users', 'write')).toBe(false)
		})

		it('should return false when neither resource nor action match', () => {
			const permission = createPermission({
				id: 1,
				name: 'Read Users',
				description: null,
				resource: 'users',
				action: 'read',
			})

			expect(permission.matches('roles', 'write')).toBe(false)
		})
	})
})
