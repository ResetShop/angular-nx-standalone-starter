import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { UserRole } from '../../contracts/permission/legacy-permission.constants'
import { LegacyUserImportConflictError, type LegacyUserImportTarget, runLegacyUserImport } from './legacy-user-import'
import type { ExistingUser } from './legacy-user-plan'
import type { LegacyUserRoleRow, LegacyUserRow, LegacyUserSource } from './legacy-user-source'

function legacyUser(id: number, email: string | null): LegacyUserRow {
	return {
		id,
		firstName: 'Ana',
		lastName: 'Gomez',
		email,
		enabled: true,
		deleted: false,
		createdAt: null,
		updatedAt: null,
	}
}

function legacyRole(userId: number, roleId: number): LegacyUserRoleRow {
	return { userId, roleId, enabled: true, deleted: false }
}

function sourceOf(users: LegacyUserRow[], roles: LegacyUserRoleRow[]): LegacyUserSource {
	return {
		readUsers: async () => users,
		readUserRoles: async () => roles,
		readUserReferences: async () => [{ table: 'sh_cash_transaction', column: 'created_user_id', userIds: [1, 2, 3] }],
	}
}

describe('runLegacyUserImport', () => {
	let writeUsers: MockFn<[readonly unknown[]], Promise<void>>

	function targetOf(existing: ExistingUser[], roleIds: number[] = [1, 2, 3, 4, 5, 6, 7]): LegacyUserImportTarget {
		return { readExistingUsers: async () => existing, readRoleIds: async () => roleIds, writeUsers }
	}

	const source = sourceOf(
		[
			legacyUser(1, 'admin@example.test'),
			legacyUser(2, 'owner@example.test'),
			legacyUser(3, null),
			legacyUser(9, 'c@example.test'),
		],
		[
			legacyRole(1, UserRole.ADMIN),
			legacyRole(2, UserRole.OWNER),
			legacyRole(3, UserRole.EMPLOYEE),
			legacyRole(9, UserRole.CUSTOMER),
		],
	)

	beforeEach(() => {
		clearAllMocks()
		writeUsers = fn<[readonly unknown[]], Promise<void>>()
		writeUsers.mockResolvedValue(undefined)
	})

	it('writes the users to create and reports what it did', async () => {
		const result = await runLegacyUserImport(source, targetOf([{ id: 1, email: 'seed@example.test' }]), {
			dryRun: false,
			alreadyProvisionedLegacyUserIds: [1],
		})

		expect(result.written).toBe(2)
		expect((writeUsers.calls[0][0] as { legacyId: number }[]).map((record) => record.legacyId)).toEqual([2, 3])
		expect(result.report).toContain('create: 2')
		expect(result.report).toContain('customer-only: 1')
		expect(result.report).toContain('Already in the target, not imported (legacy ids): 1')
	})

	it('writes nothing on a dry run but still plans against the target and reports', async () => {
		const result = await runLegacyUserImport(source, targetOf([{ id: 1, email: 'seed@example.test' }]), {
			dryRun: true,
			alreadyProvisionedLegacyUserIds: [1],
		})

		expect(writeUsers.calls).toHaveLength(0)
		expect(result.written).toBe(0)
		expect(result.report).toContain('create: 2')
	})

	it('is a no-op when every user is already in the target with the same id and email', async () => {
		const existing = [
			{ id: 1, email: 'seed@example.test' },
			{ id: 2, email: 'owner@example.test' },
			{ id: 3, email: 'no-email-3@placeholder.local' },
		]

		const result = await runLegacyUserImport(source, targetOf(existing), {
			dryRun: false,
			alreadyProvisionedLegacyUserIds: [1],
		})

		expect(writeUsers.calls).toHaveLength(0)
		expect(result.report).toContain('unchanged: 2')
	})

	it('refuses to write when the plan has a conflict, and puts the report in the error', async () => {
		const target = targetOf([{ id: 2, email: 'someone.else@example.test' }])
		const run = runLegacyUserImport(source, target, { dryRun: false, alreadyProvisionedLegacyUserIds: [] })

		await expect(run).rejects.toBeInstanceOf(LegacyUserImportConflictError)
		await expect(run).rejects.toThrow(/legacy id 2: id-taken-by-other-email/)
		expect(writeUsers.calls).toHaveLength(0)
	})

	it('does not put names or emails in the conflict error', async () => {
		const run = runLegacyUserImport(source, targetOf([{ id: 2, email: 'someone.else@example.test' }]), {
			dryRun: false,
			alreadyProvisionedLegacyUserIds: [],
		})

		await expect(run.catch((error: Error) => error.message)).resolves.not.toMatch(/example\.test|Ana|Gomez/)
	})

	it('refuses a declared already-provisioned user the target does not have', async () => {
		const run = runLegacyUserImport(source, targetOf([]), { dryRun: false, alreadyProvisionedLegacyUserIds: [1] })

		await expect(run).rejects.toThrow(/Legacy user id\(s\) 1 are declared as already in the target/)
		expect(writeUsers.calls).toHaveLength(0)
	})

	it('refuses when a role the users need is missing from the target', async () => {
		const run = runLegacyUserImport(source, targetOf([{ id: 1, email: 'seed@example.test' }], [1]), {
			dryRun: false,
			alreadyProvisionedLegacyUserIds: [1],
		})

		await expect(run).rejects.toThrow(/no role with id 2, 6; run the roles seed first/)
		expect(writeUsers.calls).toHaveLength(0)
	})

	it('checks the roles on a dry run too, so the preview cannot hide a failing real run', async () => {
		const run = runLegacyUserImport(source, targetOf([{ id: 1, email: 'seed@example.test' }], [1]), {
			dryRun: true,
			alreadyProvisionedLegacyUserIds: [1],
		})

		await expect(run).rejects.toThrow(/run the roles seed first/)
	})
})
