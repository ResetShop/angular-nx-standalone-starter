import { formatImportReport } from './legacy-import-report'
import { classifyLegacyUsers, type ImportedUserRecord } from './legacy-user-mapper'
import {
	type ExistingUser,
	hasConflicts,
	type LegacyImportPlan,
	type LegacyImportPlanEntry,
	planLegacyUserImport,
} from './legacy-user-plan'
import { groupLegacyUserIds, summarizeUserReferences } from './legacy-user-references'
import type { LegacyUserSource } from './legacy-user-source'

/** What the import needs from the database it writes to. */
export interface LegacyUserImportTarget {
	readExistingUsers(): Promise<readonly ExistingUser[]>
	/** Ids of the roles that exist in the target; the legacy roles must have been seeded. */
	readRoleIds(): Promise<readonly number[]>
	writeUsers(records: readonly ImportedUserRecord[]): Promise<void>
}

export interface LegacyUserImportOptions {
	/** Preview only: read, plan and report, but write nothing. */
	readonly dryRun: boolean
	/** Legacy ids of users that already exist in the target (the seeded administrator) and must not be imported. */
	readonly alreadyProvisionedLegacyUserIds: readonly number[]
}

export interface LegacyUserImportResult {
	readonly plan: LegacyImportPlan
	/** Counts, reason codes and legacy ids only. */
	readonly report: string
	readonly written: number
}

/** The plan has conflicts, so nothing was written. The message is the report, which holds no personal data. */
export class LegacyUserImportConflictError extends Error {
	constructor(public readonly report: string) {
		super(`The import has conflicts with the target database; nothing was written.\n${report}`)
		this.name = 'LegacyUserImportConflictError'
	}
}

function assertProvisionedUsersExist(provisionedIds: readonly number[], existing: readonly ExistingUser[]): void {
	const existingIds = new Set(existing.map((user) => user.id))
	const missing = provisionedIds.filter((id) => !existingIds.has(id))
	if (missing.length > 0) {
		throw new Error(
			`Legacy user id(s) ${missing.join(', ')} are declared as already in the target, but the target has no user with ` +
				'that id. Seed the administrator first, or do not declare the id.',
		)
	}
}

function assertRolesExist(records: readonly ImportedUserRecord[], roleIds: readonly number[]): void {
	const known = new Set(roleIds)
	const missing = [...new Set(records.map((record) => record.roleId))].filter((roleId) => !known.has(roleId))
	if (missing.length > 0) {
		throw new Error(`The target has no role with id ${missing.join(', ')}; run the roles seed first.`)
	}
}

function recordsToCreate(plan: LegacyImportPlan): ImportedUserRecord[] {
	return plan.entries.flatMap((entry: LegacyImportPlanEntry) => (entry.action === 'create' ? [entry.record] : []))
}

/**
 * Runs the import: reads the legacy users, classifies and plans them against what the target holds, and writes the
 * users to create. It refuses to write anything when the plan has conflicts, when a declared already-provisioned user
 * is missing from the target or when a role the users need does not exist. A dry run stops after the report.
 */
export async function runLegacyUserImport(
	source: LegacyUserSource,
	target: LegacyUserImportTarget,
	options: LegacyUserImportOptions,
): Promise<LegacyUserImportResult> {
	const [users, userRoles, references] = await Promise.all([
		source.readUsers(),
		source.readUserRoles(),
		source.readUserReferences(),
	])
	const classifications = classifyLegacyUsers(users, userRoles, {
		alreadyProvisionedLegacyUserIds: options.alreadyProvisionedLegacyUserIds,
	})
	const existingUsers = await target.readExistingUsers()
	assertProvisionedUsersExist(options.alreadyProvisionedLegacyUserIds, existingUsers)

	const plan = planLegacyUserImport(classifications, existingUsers)
	const report = formatImportReport(plan, summarizeUserReferences(references, groupLegacyUserIds(classifications)))
	if (hasConflicts(plan)) throw new LegacyUserImportConflictError(report)

	const toCreate = recordsToCreate(plan)
	assertRolesExist(toCreate, await target.readRoleIds())
	if (options.dryRun || toCreate.length === 0) return { plan, report, written: 0 }

	await target.writeUsers(toCreate)
	return { plan, report, written: toCreate.length }
}
