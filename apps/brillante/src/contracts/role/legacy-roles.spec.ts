import { PERMISSION_DEFINITIONS, UserRole } from '../permission/legacy-permission.constants'
import { PERMISSIONS_SEED_DATA } from '../permission/permission.constants'
import { LEGACY_ROLE_PERMISSION_MATRIX, LEGACY_ROLES, LEGACY_ROLES_TO_SEED, LegacyRoleCode } from './legacy-roles'
import { ADMIN_ROLE_CODE } from './role.constants'

describe('LEGACY_ROLES', () => {
	it('covers the seven legacy role ids exactly once, in id order', () => {
		expect(LEGACY_ROLES.map((legacyRole) => legacyRole.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
		expect(LEGACY_ROLES.map((legacyRole) => legacyRole.id)).toEqual(Object.values(UserRole).sort((a, b) => a - b))
	})

	it('gives every role a unique code and a unique name', () => {
		expect(new Set(LEGACY_ROLES.map((legacyRole) => legacyRole.code)).size).toBe(LEGACY_ROLES.length)
		expect(new Set(LEGACY_ROLES.map((legacyRole) => legacyRole.name)).size).toBe(LEGACY_ROLES.length)
	})

	it('mirrors the role the reference seed creates for the Administrator', () => {
		expect(LEGACY_ROLES[0]).toEqual({
			id: 1,
			code: ADMIN_ROLE_CODE,
			name: 'Administrator',
			description: 'System administrator with full access',
			removable: false,
		})
	})

	it('makes every role removable except the Administrator, so staff can change roles', () => {
		expect(LEGACY_ROLES.filter((legacyRole) => !legacyRole.removable).map((legacyRole) => legacyRole.id)).toEqual([1])
	})

	it('seeds every role but the Administrator', () => {
		expect(LEGACY_ROLES_TO_SEED.map((legacyRole) => legacyRole.id)).toEqual([2, 3, 4, 5, 6, 7])
		expect(LEGACY_ROLES_TO_SEED.some((legacyRole) => legacyRole.code === LegacyRoleCode.ADMIN)).toBe(false)
	})
})

describe('LEGACY_ROLE_PERMISSION_MATRIX', () => {
	it('has an entry for every legacy role code', () => {
		expect(Object.keys(LEGACY_ROLE_PERMISSION_MATRIX).sort()).toEqual([...Object.values(LegacyRoleCode)].sort())
	})

	it('lists for each role exactly the permissions the frontend table grants to its id', () => {
		for (const legacyRole of LEGACY_ROLES) {
			const expected = PERMISSION_DEFINITIONS.filter((definition) => definition.roles.includes(legacyRole.id)).map(
				(definition) => definition.identifier,
			)

			expect(LEGACY_ROLE_PERMISSION_MATRIX[legacyRole.code]).toEqual(expected)
		}
	})

	it('matches the legacy route guards except user management, written out literally', () => {
		const everything = [
			'repairs:repair:read',
			'repairs:repair:manage',
			'clients:client:read',
			'clients:client:manage',
			'cash:transaction:read',
			'cash:transaction:manage',
			'reports:cash:read',
			'settings:office_branch:manage',
			'settings:user:manage',
			'settings:cash_concept:manage',
		]
		// User management runs on the backend's admin permissions, which only the Administrator role holds.
		const withoutUserManagement = everything.filter((permission) => permission !== 'settings:user:manage')
		const staff = [
			'repairs:repair:read',
			'repairs:repair:manage',
			'clients:client:read',
			'clients:client:manage',
			'cash:transaction:read',
			'cash:transaction:manage',
			'settings:office_branch:manage',
			'settings:cash_concept:manage',
		]

		expect(LEGACY_ROLE_PERMISSION_MATRIX).toEqual({
			admin: everything,
			owner: withoutUserManagement,
			counter_clerk: staff,
			repairman: ['repairs:repair:read', 'repairs:repair:manage', 'settings:cash_concept:manage'],
			customer: [],
			employee: [
				'repairs:repair:read',
				'repairs:repair:manage',
				'cash:transaction:read',
				'cash:transaction:manage',
				'settings:cash_concept:manage',
			],
			accountant: ['reports:cash:read'],
		})
	})

	it('grants customers nothing, as in the legacy guards', () => {
		expect(LEGACY_ROLE_PERMISSION_MATRIX[LegacyRoleCode.CUSTOMER]).toEqual([])
	})

	it('is not applied: none of its permissions exists in the database catalogue yet', () => {
		const catalogue = new Set<string>(PERMISSIONS_SEED_DATA.map((seeded) => seeded.name))
		const matrixPermissions = Object.values(LEGACY_ROLE_PERMISSION_MATRIX).flat()

		expect(matrixPermissions.length).toBeGreaterThan(0)
		// If this fails, a matrix permission was added to the catalogue: decide whether to grant it to the roles and
		// update the seed instead of letting the matrix and the database silently diverge.
		expect(matrixPermissions.some((identifier) => catalogue.has(identifier))).toBe(false)
	})
})
