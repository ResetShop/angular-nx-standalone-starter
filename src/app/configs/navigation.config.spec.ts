import { PERMISSION_DEFINITIONS } from '@contracts/permission/permission.constants'

describe('permission identifiers', () => {
	const validIdentifiers = new Set(PERMISSION_DEFINITIONS.map((p) => p.identifier))

	it('should use valid permission identifiers', () => {
		expect(validIdentifiers.has('admin:users:read')).toBe(true)
		expect(validIdentifiers.has('admin:roles:read')).toBe(true)
		expect(validIdentifiers.has('admin:permissions:read')).toBe(true)
	})
})
