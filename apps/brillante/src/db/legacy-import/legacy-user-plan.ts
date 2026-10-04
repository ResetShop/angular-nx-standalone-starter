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
): LegacyImportConflictReason | null {
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

function countEmails(records: readonly ImportedUserRecord[]): Map<string, number> {
	const counts = new Map<string, number>()
	for (const record of records) counts.set(record.email, (counts.get(record.email) ?? 0) + 1)
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
	const importEmails = countEmails(records)

	const entries = records.map((record): LegacyImportPlanEntry => {
		const reason = conflictFor(record, existingById, existingByEmail, importEmails)
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
		placeholderEmailIds: records.filter((record) => record.emailIsPlaceholder).map((record) => record.legacyId),
	}
}
