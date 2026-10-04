import { UserRole } from '../../contracts/permission/legacy-permission.constants'
import { UserStatus } from '../../contracts/user/user.constants'
import { formatImportReport } from './legacy-import-report'
import { classifyLegacyUsers, type LegacyUserClassification } from './legacy-user-mapper'
import { hasConflicts, LegacyImportConflictReason, planLegacyUserImport } from './legacy-user-plan'
import { summarizeUserReferences } from './legacy-user-references'
import type { LegacyUserRoleRow, LegacyUserRow } from './legacy-user-source'

function imported(id: number, email: string): LegacyUserClassification {
	return {
		kind: 'import',
		record: {
			legacyId: id,
			firstName: 'Ana',
			lastName: 'Gomez',
			email,
			emailIsPlaceholder: false,
			roleId: UserRole.OWNER,
			status: UserStatus.ACTIVE,
			statusChangedAt: null,
			deletedAt: null,
			createdAt: null,
			updatedAt: null,
		},
	}
}

describe('planLegacyUserImport', () => {
	it('plans a create for every user the target does not know', () => {
		const plan = planLegacyUserImport([imported(2, 'a@example.test'), imported(3, 'b@example.test')], [])

		expect(plan.entries.map((entry) => entry.action)).toEqual(['create', 'create'])
		expect(hasConflicts(plan)).toBe(false)
	})

	it('treats a user already present with the same id and email as unchanged, so a re-run is a no-op', () => {
		const plan = planLegacyUserImport([imported(2, 'a@example.test')], [{ id: 2, email: 'A@Example.test' }])

		expect(plan.entries).toEqual([{ action: 'unchanged', legacyId: 2 }])
	})

	it('flags an id that the target holds with another email', () => {
		const plan = planLegacyUserImport([imported(1, 'legacy@example.test')], [{ id: 1, email: 'seeded@example.test' }])

		expect(plan.entries).toEqual([
			{ action: 'conflict', legacyId: 1, reason: LegacyImportConflictReason.ID_TAKEN_BY_OTHER_EMAIL },
		])
		expect(hasConflicts(plan)).toBe(true)
	})

	it('flags an email that the target holds under another id', () => {
		const plan = planLegacyUserImport([imported(5, 'a@example.test')], [{ id: 40, email: 'a@example.test' }])

		expect(plan.entries).toEqual([
			{ action: 'conflict', legacyId: 5, reason: LegacyImportConflictReason.EMAIL_TAKEN_BY_OTHER_ID },
		])
	})

	it('flags two imported users that resolve to the same email', () => {
		const plan = planLegacyUserImport([imported(5, 'same@example.test'), imported(6, 'same@example.test')], [])

		expect(plan.entries.map((entry) => entry.action === 'conflict' && entry.reason)).toEqual([
			LegacyImportConflictReason.DUPLICATE_EMAIL_IN_IMPORT,
			LegacyImportConflictReason.DUPLICATE_EMAIL_IN_IMPORT,
		])
	})

	it('carries the excluded users, the users already in the target and the ids with placeholder emails', () => {
		const users: LegacyUserRow[] = [
			{
				id: 1,
				firstName: 'E',
				lastName: 'F',
				email: 'e@example.test',
				enabled: true,
				deleted: false,
				createdAt: null,
				updatedAt: null,
			},
			{
				id: 2,
				firstName: 'A',
				lastName: 'B',
				email: null,
				enabled: false,
				deleted: false,
				createdAt: null,
				updatedAt: null,
			},
			{
				id: 3,
				firstName: 'C',
				lastName: 'D',
				email: 'c@example.test',
				enabled: true,
				deleted: false,
				createdAt: null,
				updatedAt: null,
			},
		]
		const roles: LegacyUserRoleRow[] = [
			{ userId: 1, roleId: UserRole.ADMIN, enabled: true, deleted: false },
			{ userId: 2, roleId: UserRole.EMPLOYEE, enabled: true, deleted: false },
			{ userId: 3, roleId: UserRole.CUSTOMER, enabled: true, deleted: false },
		]

		const plan = planLegacyUserImport(classifyLegacyUsers(users, roles, { alreadyProvisionedLegacyUserIds: [1] }), [])

		expect(plan.provisionedLegacyIds).toEqual([1])
		expect(plan.placeholderEmailIds).toEqual([2])
		expect(plan.excluded).toEqual([{ legacyId: 3, reason: 'customer-only' }])
	})
})

describe('summarizeUserReferences', () => {
	it('counts references to imported users, excluded users, nulls and other values', () => {
		const summary = summarizeUserReferences(
			[{ table: 'sh_cash_transaction', column: 'created_user_id', userIds: [2, 2, 1, 7, 7, 8, null, 0] }],
			{ imported: new Set([2]), provisioned: new Set([1]), excluded: new Set([7, 8]) },
		)

		expect(summary).toEqual([
			{
				table: 'sh_cash_transaction',
				column: 'created_user_id',
				rows: 8,
				toImportedUsers: 2,
				toProvisionedUsers: 1,
				toExcludedUsers: 3,
				distinctExcludedUsers: 2,
				nullValues: 1,
				otherValues: 1,
			},
		])
	})

	it('reports an empty column', () => {
		const [summary] = summarizeUserReferences([{ table: 't', column: 'c', userIds: [] }], {
			imported: new Set(),
			provisioned: new Set(),
			excluded: new Set(),
		})

		expect(summary.rows).toBe(0)
	})
})

describe('formatImportReport', () => {
	const plan = planLegacyUserImport(
		[
			{ ...imported(2, 'first.person@example.test') },
			{ ...imported(3, 'second.person@example.test') },
			{ kind: 'excluded', legacyId: 9, reason: 'customer-only' },
			{ kind: 'provisioned', legacyId: 1 },
		],
		[{ id: 3, email: 'other@example.test' }],
	)
	const references = summarizeUserReferences(
		[{ table: 'sh_cash_transaction', column: 'created_user_id', userIds: [2, 9, 1] }],
		{ imported: new Set([2, 3]), provisioned: new Set([1]), excluded: new Set([9]) },
	)

	it('lists planned actions, exclusion reasons, conflicts and reference counts', () => {
		const report = formatImportReport(plan, references)

		expect(report).toContain('create: 1')
		expect(report).toContain('conflict: 1')
		expect(report).toContain('customer-only: 1')
		expect(report).toContain('legacy id 3: id-taken-by-other-email')
		expect(report).toContain('Already in the target, not imported (legacy ids): 1')
		expect(report).toContain(
			'sh_cash_transaction.created_user_id: 3 rows, 1 to imported users, 1 to users already in the target, 1 to excluded users',
		)
		expect(report).not.toContain('skipped')
	})

	it('never prints names or emails', () => {
		const report = formatImportReport(plan, references)

		expect(report).not.toMatch(/example\.test|Ana|Gomez/)
	})

	it('says so when there is nothing to report', () => {
		const report = formatImportReport(planLegacyUserImport([], []))

		expect(report).toContain('Planned: none')
		expect(report).toContain('Excluded (customers and unusable roles): none')
		expect(report).toContain('Conflicts: none')
	})
})
