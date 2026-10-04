import type { LegacyUserClassification } from './legacy-user-mapper'
import type { LegacyUserReferenceColumn } from './legacy-user-source'

/** How the values of one legacy column relate to the legacy users: imported, already in the target, or customers. */
export interface LegacyUserReferenceSummary {
	readonly table: string
	readonly column: string
	readonly rows: number
	readonly toImportedUsers: number
	/** Rows that point at a user which already exists in the target, such as the seeded administrator. */
	readonly toProvisionedUsers: number
	/** Rows that point at a user the import leaves out (the customers). */
	readonly toExcludedUsers: number
	/** Distinct excluded users that rows point at. */
	readonly distinctExcludedUsers: number
	readonly nullValues: number
	/** Values that are no legacy user at all, such as the 0 that stands for the system. */
	readonly otherValues: number
}

/** The legacy user ids by what the import does with them. */
export interface LegacyUserIdGroups {
	readonly imported: ReadonlySet<number>
	readonly provisioned: ReadonlySet<number>
	readonly excluded: ReadonlySet<number>
}

/** Groups the legacy user ids of a classification by what the import does with them. */
export function groupLegacyUserIds(classifications: readonly LegacyUserClassification[]): LegacyUserIdGroups {
	const groups = { imported: new Set<number>(), provisioned: new Set<number>(), excluded: new Set<number>() }
	for (const classification of classifications) {
		if (classification.kind === 'import') {
			groups.imported.add(classification.record.legacyId)
		} else {
			groups[classification.kind].add(classification.legacyId)
		}
	}
	return groups
}

function summarizeColumn(reference: LegacyUserReferenceColumn, groups: LegacyUserIdGroups): LegacyUserReferenceSummary {
	const excludedSeen = new Set<number>()
	let toImportedUsers = 0
	let toProvisionedUsers = 0
	let toExcludedUsers = 0
	let nullValues = 0
	let otherValues = 0

	for (const userId of reference.userIds) {
		if (userId === null) {
			nullValues += 1
		} else if (groups.imported.has(userId)) {
			toImportedUsers += 1
		} else if (groups.provisioned.has(userId)) {
			toProvisionedUsers += 1
		} else if (groups.excluded.has(userId)) {
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
		toProvisionedUsers,
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
	groups: LegacyUserIdGroups,
): LegacyUserReferenceSummary[] {
	return references.map((reference) => summarizeColumn(reference, groups))
}
