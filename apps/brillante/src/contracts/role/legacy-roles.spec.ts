import { PERMISSION_DEFINITIONS, UserRole } from '../permission/legacy-permission.constants'
import { PERMISSIONS_SEED_DATA } from '../permission/permission.constants'
import { LEGACY_ROLE_PERMISSION_MATRIX, LEGACY_ROLES, LEGACY_ROLES_TO_SEED, LegacyRoleCode } from './legacy-roles'
import { ADMIN_ROLE_CODE } from './role.constants'

describe('LEGACY_ROLES', () => {
	it('covers the seven legacy role ids exactly once, in id order', () => {
		expect(LEGACY_ROLES.map((legacyRole) => legacyRole.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
		expect(LEGACY_ROLES.map((legacyRole) => legacyRole.id)).toEqual(Object.values(UserRole).sort())
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

	it('marks every role as not removable', () => {
		expect(LEGACY_ROLES.every((legacyRole) => !legacyRole.removable)).toBe(true)
	})

	it('seeds every role but the Administrator', () => {
		expect(LEGACY_ROLES_TO_SEED.map((legacyRole) => legacyRole.id)).toEqual([2, 3, 4, 5, 6, 7])
		expect(LEGACY_ROLES_TO_SEED.some((legacyRole) => legacyRole.code === LegacyRoleCode.ADMIN)).toBe(false)
	})
})

describe('LEGACY_ROLE_PERMISSION_MATRIX', () => {
	it('has an entry for every legacy role code', () => {
		expect(Object.keys(LEGACY_ROLE_PERMISSION_MATRIX).sort()).toEqual(Object.values(LegacyRoleCode).sort())
	})

	it('lists for each role exactly the permissions the frontend table grants to its id', () => {
		for (const legacyRole of LEGACY_ROLES) {
			const expected = PERMISSION_DEFINITIONS.filter((definition) => definition.roles.includes(legacyRole.id)).map(
				(definition) => definition.identifier,
			)

			expect(LEGACY_ROLE_PERMISSION_MATRIX[legacyRole.code]).toEqual(expected)
		}
	})

	it('grants customers nothing, as in the legacy guards', () => {
		expect(LEGACY_ROLE_PERMISSION_MATRIX[LegacyRoleCode.CUSTOMER]).toEqual([])
	})

	it('is not applied: none of its permissions exists in the database catalogue yet', () => {
		const catalogue = new Set<string>(PERMISSIONS_SEED_DATA.map((seeded) => seeded.name))
		const matrixPermissions = Object.values(LEGACY_ROLE_PERMISSION_MATRIX).flat()

		expect(matrixPermissions.length).toBeGreaterThan(0)
		expect(matrixPermissions.some((identifier) => catalogue.has(identifier))).toBe(false)
	})
})
