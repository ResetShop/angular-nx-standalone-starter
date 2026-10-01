import { PERMISSION_DEFINITIONS, Permission, UserRole } from './permission.constants'

describe('permission catalogue', () => {
	const identifierPattern = /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/

	it('uses the module:resource:action format for every identifier', () => {
		for (const definition of PERMISSION_DEFINITIONS) {
			expect(definition.identifier).toMatch(identifierPattern)
		}
	})

	it('defines every Permission constant exactly once', () => {
		const identifiers = PERMISSION_DEFINITIONS.map((definition) => definition.identifier)

		expect([...identifiers].sort()).toEqual(Object.values(Permission).sort())
	})

	it('only references known role ids', () => {
		const knownRoles = new Set<number>(Object.values(UserRole))

		for (const definition of PERMISSION_DEFINITIONS) {
			expect(definition.roles.every((role) => knownRoles.has(role))).toBe(true)
		}
	})
})
