import { createPermission } from './permission.mapper'
import { createRole } from './role.mapper'

describe('Role', () => {
	const createTestPermissions = () => [
		createPermission({ id: 1, name: 'Read Users', description: null, resource: 'users', action: 'read' }),
		createPermission({ id: 2, name: 'Write Users', description: null, resource: 'users', action: 'write' }),
		createPermission({ id: 3, name: 'Read Roles', description: null, resource: 'roles', action: 'read' }),
	]

	describe('createRole', () => {
		it('should create a role with all properties', () => {
			const permissions = createTestPermissions()
			const role = createRole({
				id: 1,
				code: 'admin',
				name: 'Administrator',
				description: 'Full access',
				removable: true,
				createdAt: null,
				updatedAt: null,
				permissions,
			})

			expect(role.id).toBe(1)
			expect(role.code).toBe('admin')
			expect(role.name).toBe('Administrator')
			expect(role.description).toBe('Full access')
			expect(role.permissions).toEqual(permissions)
		})

		it('should allow null description', () => {
			const role = createRole({
				id: 1,
				code: 'admin',
				name: 'Administrator',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
				permissions: [],
			})

			expect(role.description).toBeNull()
		})

		it('should allow empty permissions array', () => {
			const role = createRole({
				id: 1,
				code: 'guest',
				name: 'Guest',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
				permissions: [],
			})

			expect(role.permissions).toEqual([])
		})
	})

	describe('hasPermission', () => {
		it('should return true when permission exists', () => {
			const permissions = createTestPermissions()
			const role = createRole({
				id: 1,
				code: 'admin',
				name: 'Administrator',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
				permissions,
			})

			expect(role.hasPermission('users', 'read')).toBe(true)
			expect(role.hasPermission('users', 'write')).toBe(true)
			expect(role.hasPermission('roles', 'read')).toBe(true)
		})

		it('should return false when permission does not exist', () => {
			const permissions = createTestPermissions()
			const role = createRole({
				id: 1,
				code: 'admin',
				name: 'Administrator',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
				permissions,
			})

			expect(role.hasPermission('roles', 'write')).toBe(false)
			expect(role.hasPermission('posts', 'read')).toBe(false)
		})

		it('should return false for empty permissions', () => {
			const role = createRole({
				id: 1,
				code: 'guest',
				name: 'Guest',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
				permissions: [],
			})

			expect(role.hasPermission('users', 'read')).toBe(false)
		})
	})

	describe('hasPermissionByIdentifier', () => {
		it('should return true when permission identifier exists', () => {
			const permissions = createTestPermissions()
			const role = createRole({
				id: 1,
				code: 'admin',
				name: 'Administrator',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
				permissions,
			})

			expect(role.hasPermissionByIdentifier('users:read')).toBe(true)
			expect(role.hasPermissionByIdentifier('users:write')).toBe(true)
			expect(role.hasPermissionByIdentifier('roles:read')).toBe(true)
		})

		it('should return false when permission identifier does not exist', () => {
			const permissions = createTestPermissions()
			const role = createRole({
				id: 1,
				code: 'admin',
				name: 'Administrator',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
				permissions,
			})

			expect(role.hasPermissionByIdentifier('roles:write')).toBe(false)
			expect(role.hasPermissionByIdentifier('posts:read')).toBe(false)
		})

		it('should return false for empty permissions', () => {
			const role = createRole({
				id: 1,
				code: 'guest',
				name: 'Guest',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
				permissions: [],
			})

			expect(role.hasPermissionByIdentifier('users:read')).toBe(false)
		})
	})
})
