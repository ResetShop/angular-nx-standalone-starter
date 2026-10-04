import { UserRole } from '../../contracts/permission/legacy-permission.constants'
import { UserStatus } from '../../contracts/user/user.constants'
import { classifyLegacyUsers, LegacyExclusionReason, placeholderEmail } from './legacy-user-mapper'
import type { LegacyUserRoleRow, LegacyUserRow } from './legacy-user-source'

function user(overrides: Partial<LegacyUserRow> & { id: number }): LegacyUserRow {
	return {
		firstName: 'Ana',
		lastName: 'Gomez',
		email: `user${overrides.id}@example.test`,
		enabled: true,
		deleted: false,
		createdAt: new Date('2020-01-02T03:04:05.000Z'),
		updatedAt: new Date('2021-06-07T08:09:10.000Z'),
		...overrides,
	}
}

function role(userId: number, roleId: number, overrides: Partial<LegacyUserRoleRow> = {}): LegacyUserRoleRow {
	return { userId, roleId, enabled: true, deleted: false, ...overrides }
}

describe('classifyLegacyUsers', () => {
	it('imports a user with a single active staff role, keeping the legacy ids', () => {
		const [result] = classifyLegacyUsers([user({ id: 5 })], [role(5, UserRole.COUNTER_CLERK)])

		expect(result).toEqual({
			kind: 'import',
			record: {
				legacyId: 5,
				firstName: 'Ana',
				lastName: 'Gomez',
				email: 'user5@example.test',
				emailIsPlaceholder: false,
				roleId: UserRole.COUNTER_CLERK,
				status: UserStatus.ACTIVE,
				statusChangedAt: null,
				deletedAt: null,
				createdAt: new Date('2020-01-02T03:04:05.000Z'),
				updatedAt: new Date('2021-06-07T08:09:10.000Z'),
			},
		})
	})

	it('excludes users whose only active role is Cliente', () => {
		const [result] = classifyLegacyUsers([user({ id: 6 })], [role(6, UserRole.CUSTOMER)])

		expect(result).toEqual({ kind: 'excluded', legacyId: 6, reason: LegacyExclusionReason.CUSTOMER_ONLY })
	})

	it('ignores soft-deleted and disabled role rows when counting the active role', () => {
		const roles = [role(7, UserRole.EMPLOYEE, { deleted: true, enabled: false }), role(7, UserRole.ACCOUNTANT)]

		const [result] = classifyLegacyUsers([user({ id: 7 })], roles)

		expect(result.kind === 'import' && result.record.roleId).toBe(UserRole.ACCOUNTANT)
	})

	it('excludes a user without an active role', () => {
		const [result] = classifyLegacyUsers([user({ id: 8 })], [role(8, UserRole.OWNER, { deleted: true })])

		expect(result).toMatchObject({ kind: 'excluded', reason: LegacyExclusionReason.NO_ACTIVE_ROLE })
	})

	it('counts a repeated identical active role row as one role', () => {
		const [result] = classifyLegacyUsers([user({ id: 9 })], [role(9, UserRole.OWNER), role(9, UserRole.OWNER)])

		expect(result.kind).toBe('import')
	})

	it('excludes a user with more than one active role, as the plan assumes exactly one', () => {
		const [result] = classifyLegacyUsers([user({ id: 9 })], [role(9, UserRole.OWNER), role(9, UserRole.EMPLOYEE)])

		expect(result).toMatchObject({ kind: 'excluded', reason: LegacyExclusionReason.MULTIPLE_ROLES })
	})

	it('excludes a user whose role is not one of the seven legacy roles', () => {
		const [result] = classifyLegacyUsers([user({ id: 10 })], [role(10, 99)])

		expect(result).toMatchObject({ kind: 'excluded', reason: LegacyExclusionReason.UNKNOWN_ROLE })
	})

	it('leaves alone the users that already exist in the target, whatever their role', () => {
		const results = classifyLegacyUsers(
			[user({ id: 1 }), user({ id: 2 })],
			[role(1, UserRole.ADMIN), role(2, UserRole.ADMIN)],
			{ alreadyProvisionedLegacyUserIds: [1] },
		)

		expect(results[0]).toEqual({ kind: 'provisioned', legacyId: 1 })
		expect(results[1].kind).toBe('import')
	})

	it('imports an administrator like any other staff user when it is not provisioned', () => {
		const [result] = classifyLegacyUsers([user({ id: 1 })], [role(1, UserRole.ADMIN)])

		expect(result.kind === 'import' && result.record.roleId).toBe(UserRole.ADMIN)
	})

	describe('email', () => {
		it('trims and lower-cases the email', () => {
			const [result] = classifyLegacyUsers(
				[user({ id: 11, email: '  Mixed.Case@Example.TEST ' })],
				[role(11, UserRole.OWNER)],
			)

			expect(result.kind === 'import' && result.record.email).toBe('mixed.case@example.test')
		})

		it.each([null, '', '   '])('generates a placeholder address for the missing email %j', (email) => {
			const [result] = classifyLegacyUsers([user({ id: 12, email })], [role(12, UserRole.EMPLOYEE)])

			expect(result.kind === 'import' && result.record.email).toBe(placeholderEmail(12))
			expect(result.kind === 'import' && result.record.emailIsPlaceholder).toBe(true)
		})

		it('builds a placeholder that is unique per user and never deliverable', () => {
			expect(placeholderEmail(2)).toBe('no-email-2@placeholder.local')
			expect(placeholderEmail(2)).not.toBe(placeholderEmail(3))
		})
	})

	describe('status', () => {
		it('imports a disabled user as disabled, changed at its last update', () => {
			const [result] = classifyLegacyUsers([user({ id: 13, enabled: false })], [role(13, UserRole.COUNTER_CLERK)])

			expect(result.kind === 'import' && result.record).toMatchObject({
				status: UserStatus.DISABLED,
				statusChangedAt: new Date('2021-06-07T08:09:10.000Z'),
				deletedAt: null,
			})
		})

		it('imports a soft-deleted user as deleted, with its last update as the deletion time', () => {
			const [result] = classifyLegacyUsers([user({ id: 14, deleted: true })], [role(14, UserRole.COUNTER_CLERK)])

			expect(result.kind === 'import' && result.record).toMatchObject({
				status: UserStatus.DELETED,
				deletedAt: new Date('2021-06-07T08:09:10.000Z'),
			})
		})
	})

	it('trims the names and keeps missing legacy dates as null', () => {
		const [result] = classifyLegacyUsers(
			[user({ id: 15, firstName: ' Eva ', lastName: ' Luz ', createdAt: null, updatedAt: null })],
			[role(15, UserRole.REPAIRMAN)],
		)

		expect(result.kind === 'import' && result.record).toMatchObject({
			firstName: 'Eva',
			lastName: 'Luz',
			createdAt: null,
			updatedAt: null,
		})
	})

	it('classifies every user once, in input order', () => {
		const users = [user({ id: 3 }), user({ id: 1 }), user({ id: 2 })]

		const results = classifyLegacyUsers(users, [])

		expect(results.map((result) => (result.kind === 'import' ? result.record.legacyId : result.legacyId))).toEqual([
			3, 1, 2,
		])
	})
})
