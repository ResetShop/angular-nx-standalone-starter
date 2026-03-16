import type { PermissionData, RoleWithPermissions } from '@contracts/role/role.types'
import { mapPermission, mapRole } from './role.mapper'

describe('Role Mapper', () => {
	describe('mapPermission', () => {
		it('should map PermissionData to IPermission', () => {
			const data: PermissionData = {
				id: 1,
				name: 'Read Users',
				description: 'Can read user data',
				resource: 'users',
				action: 'read',
			}

			const permission = mapPermission(data)

			expect(permission.id).toBe(1)
			expect(permission.name).toBe('Read Users')
			expect(permission.description).toBe('Can read user data')
			expect(permission.resource).toBe('users')
			expect(permission.action).toBe('read')
			expect(permission.identifier).toBe('users:read')
		})

		it('should handle null description', () => {
			const data: PermissionData = {
				id: 1,
				name: 'Read Users',
				description: null,
				resource: 'users',
				action: 'read',
			}

			const permission = mapPermission(data)

			expect(permission.description).toBeNull()
		})

		it('should create permission with working matches method', () => {
			const data: PermissionData = {
				id: 1,
				name: 'Read Users',
				description: null,
				resource: 'users',
				action: 'read',
			}

			const permission = mapPermission(data)

			expect(permission.matches('users', 'read')).toBe(true)
			expect(permission.matches('users', 'write')).toBe(false)
		})
	})

	describe('mapRole', () => {
		it('should map RoleWithPermissions to IRole', () => {
			const data: RoleWithPermissions = {
				id: 1,
				code: 'admin',
				name: 'Administrator',
				description: 'Full access',
				permissions: [
					{ id: 1, name: 'Read Users', description: null, resource: 'users', action: 'read' },
					{ id: 2, name: 'Write Users', description: null, resource: 'users', action: 'write' },
				],
			}

			const role = mapRole(data)

			expect(role.id).toBe(1)
			expect(role.code).toBe('admin')
			expect(role.name).toBe('Administrator')
			expect(role.description).toBe('Full access')
			expect(role.permissions).toHaveLength(2)
		})

		it('should handle null description', () => {
			const data: RoleWithPermissions = {
				id: 1,
				code: 'guest',
				name: 'Guest',
				description: null,
				permissions: [],
			}

			const role = mapRole(data)

			expect(role.description).toBeNull()
		})

		it('should handle empty permissions', () => {
			const data: RoleWithPermissions = {
				id: 1,
				code: 'guest',
				name: 'Guest',
				description: null,
				permissions: [],
			}

			const role = mapRole(data)

			expect(role.permissions).toEqual([])
		})

		it('should create role with working permission methods', () => {
			const data: RoleWithPermissions = {
				id: 1,
				code: 'admin',
				name: 'Administrator',
				description: null,
				permissions: [{ id: 1, name: 'Read Users', description: null, resource: 'users', action: 'read' }],
			}

			const role = mapRole(data)

			expect(role.hasPermission('users', 'read')).toBe(true)
			expect(role.hasPermission('users', 'write')).toBe(false)
			expect(role.hasPermissionByIdentifier('users:read')).toBe(true)
		})
	})
})
