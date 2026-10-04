import type { LegacyUserReferenceColumn } from './legacy-user-source'

/** How the values of one legacy column relate to the users the import keeps and leaves out. */
export interface LegacyUserReferenceSummary {
	readonly table: string
	readonly column: string
	readonly rows: number
	readonly toImportedUsers: number
	readonly toExcludedUsers: number
	/** Distinct excluded users that rows point at. */
	readonly distinctExcludedUsers: number
	readonly nullValues: number
	/** Values that are neither an imported nor an excluded user, such as the 0 that stands for the system. */
	readonly otherValues: number
}

function summarizeColumn(
	reference: LegacyUserReferenceColumn,
	importedIds: ReadonlySet<number>,
	excludedIds: ReadonlySet<number>,
): LegacyUserReferenceSummary {
	const excludedSeen = new Set<number>()
	let toImportedUsers = 0
	let toExcludedUsers = 0
	let nullValues = 0
	let otherValues = 0

	for (const userId of reference.userIds) {
		if (userId === null) {
			nullValues += 1
		} else if (importedIds.has(userId)) {
			toImportedUsers += 1
		} else if (excludedIds.has(userId)) {
			toExcludedUsers += 1
			excludedSeen.add(userId)
		} else {
			otherValues += 1
		}
	}

	return {
		table: reference.table,
		column: reference.column,
		rows: reference.userIds.length,
		toImportedUsers,
		toExcludedUsers,
		distinctExcludedUsers: excludedSeen.size,
		nullValues,
		otherValues,
	}
}

/**
 * Answers "which excluded users do the other legacy tables still point at?", so the exclusion can be judged
 * before cut-over. Only counts are produced; no value identifies a person.
 */
export function summarizeUserReferences(
	references: readonly LegacyUserReferenceColumn[],
	importedIds: ReadonlySet<number>,
	excludedIds: ReadonlySet<number>,
): LegacyUserReferenceSummary[] {
	return references.map((reference) => summarizeColumn(reference, importedIds, excludedIds))
}
