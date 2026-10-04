import type { ImportedUserRecord, LegacyExclusionReason, LegacyUserClassification } from './legacy-user-mapper'

/** A user already present in the target database. */
export interface ExistingUser {
	readonly id: number
	readonly email: string
}

export const LegacyImportConflictReason = Object.freeze({
	/** The id is taken in the target by a user with another email. */
	ID_TAKEN_BY_OTHER_EMAIL: 'id-taken-by-other-email',
	/** The email is taken in the target by a user with another id. */
	EMAIL_TAKEN_BY_OTHER_ID: 'email-taken-by-other-id',
	/** The dump holds the same legacy id more than once. */
	DUPLICATE_ID_IN_IMPORT: 'duplicate-id-in-import',
	/** Two imported users resolve to the same email. */
	DUPLICATE_EMAIL_IN_IMPORT: 'duplicate-email-in-import',
} as const)

export type LegacyImportConflictReason = (typeof LegacyImportConflictReason)[keyof typeof LegacyImportConflictReason]

export type LegacyImportPlanEntry =
	| { readonly action: 'create'; readonly record: ImportedUserRecord }
	| { readonly action: 'unchanged'; readonly legacyId: number }
	| { readonly action: 'conflict'; readonly legacyId: number; readonly reason: LegacyImportConflictReason }

export interface LegacyImportPlan {
	readonly entries: readonly LegacyImportPlanEntry[]
	readonly excluded: readonly { readonly legacyId: number; readonly reason: LegacyExclusionReason }[]
	/** Legacy ids of users that already exist in the target and were not imported. */
	readonly provisionedLegacyIds: readonly number[]
	readonly placeholderEmailIds: readonly number[]
}

export function hasConflicts(plan: LegacyImportPlan): boolean {
	return plan.entries.some((entry) => entry.action === 'conflict')
}

function conflictFor(
	record: ImportedUserRecord,
	existingById: ReadonlyMap<number, string>,
	existingByEmail: ReadonlyMap<string, number>,
	importEmails: ReadonlyMap<string, number>,
	importIds: ReadonlyMap<number, number>,
): LegacyImportConflictReason | null {
	if ((importIds.get(record.legacyId) ?? 0) > 1) return LegacyImportConflictReason.DUPLICATE_ID_IN_IMPORT
	const existingEmail = existingById.get(record.legacyId)
	if (existingEmail !== undefined && existingEmail !== record.email) {
		return LegacyImportConflictReason.ID_TAKEN_BY_OTHER_EMAIL
	}
	const idWithEmail = existingByEmail.get(record.email)
	if (idWithEmail !== undefined && idWithEmail !== record.legacyId) {
		return LegacyImportConflictReason.EMAIL_TAKEN_BY_OTHER_ID
	}
	return (importEmails.get(record.email) ?? 0) > 1 ? LegacyImportConflictReason.DUPLICATE_EMAIL_IN_IMPORT : null
}

function countBy<K>(records: readonly ImportedUserRecord[], key: (record: ImportedUserRecord) => K): Map<K, number> {
	const counts = new Map<K, number>()
	for (const record of records) counts.set(key(record), (counts.get(key(record)) ?? 0) + 1)
	return counts
}

/**
 * Compares what would be imported with what the target database already holds. A user whose id and email are
 * both present is `unchanged` (re-running the import is a no-op); a clash on either is a `conflict`, and the
 * caller must not write anything while any conflict exists. Existing emails are compared case-insensitively.
 */
export function planLegacyUserImport(
	classifications: readonly LegacyUserClassification[],
	existingUsers: readonly ExistingUser[],
): LegacyImportPlan {
	const records = classifications.flatMap((entry) => (entry.kind === 'import' ? [entry.record] : []))
	const existingById = new Map(existingUsers.map((existing) => [existing.id, existing.email.toLowerCase()]))
	const existingByEmail = new Map(existingUsers.map((existing) => [existing.email.toLowerCase(), existing.id]))
	const importEmails = countBy(records, (record) => record.email)
	const importIds = countBy(records, (record) => record.legacyId)

	const entries = records.map((record): LegacyImportPlanEntry => {
		const reason = conflictFor(record, existingById, existingByEmail, importEmails, importIds)
		if (reason) return { action: 'conflict', legacyId: record.legacyId, reason }
		return existingById.has(record.legacyId)
			? { action: 'unchanged', legacyId: record.legacyId }
			: { action: 'create', record }
	})

	return {
		entries,
		excluded: classifications.flatMap((entry) =>
			entry.kind === 'excluded' ? [{ legacyId: entry.legacyId, reason: entry.reason }] : [],
		),
		provisionedLegacyIds: classifications.flatMap((entry) => (entry.kind === 'provisioned' ? [entry.legacyId] : [])),
		placeholderEmailIds: records.filter((record) => record.emailIsPlaceholder).map((record) => record.legacyId),
	}
}
