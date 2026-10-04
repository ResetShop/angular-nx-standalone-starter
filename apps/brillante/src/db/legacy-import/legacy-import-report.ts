import type { LegacyImportPlan } from './legacy-user-plan'
import type { LegacyUserReferenceSummary } from './legacy-user-references'

function countBy<T>(items: readonly T[], key: (item: T) => string): Map<string, number> {
	const counts = new Map<string, number>()
	for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1)
	return counts
}

function formatCounts(title: string, counts: ReadonlyMap<string, number>): string[] {
	if (counts.size === 0) return [`${title}: none`]
	return [`${title}:`, ...[...counts].sort().map(([name, count]) => `  ${name}: ${count}`)]
}

function formatReferences(references: readonly LegacyUserReferenceSummary[]): string[] {
	if (references.length === 0) return []
	return [
		'Legacy columns that hold a user id:',
		...references.map(
			(reference) =>
				`  ${reference.table}.${reference.column}: ${reference.rows} rows, ${reference.toImportedUsers} to imported users, ` +
				`${reference.toProvisionedUsers} to users already in the target, ` +
				`${reference.toExcludedUsers} to excluded users (${reference.distinctExcludedUsers} distinct), ` +
				`${reference.nullValues} null, ${reference.otherValues} other`,
		),
	]
}

/**
 * Text report of an import plan. It lists counts, reason codes and legacy user ids only: names, emails and
 * hashes never appear, so the report is safe to paste into a ticket or a terminal log.
 */
export function formatImportReport(
	plan: LegacyImportPlan,
	references: readonly LegacyUserReferenceSummary[] = [],
): string {
	const conflicts = plan.entries.flatMap((entry) => (entry.action === 'conflict' ? [entry] : []))
	const lines = [
		...formatCounts(
			'Planned',
			countBy(plan.entries, (entry) => entry.action),
		),
		...formatCounts(
			'Excluded (customers and unusable roles)',
			countBy(plan.excluded, (entry) => entry.reason),
		),
		`Already in the target, not imported (legacy ids): ${plan.provisionedLegacyIds.join(', ') || 'none'}`,
		`Users with a generated placeholder email (legacy ids): ${plan.placeholderEmailIds.join(', ') || 'none'}`,
		...(conflicts.length > 0
			? ['Conflicts:', ...conflicts.map((conflict) => `  legacy id ${conflict.legacyId}: ${conflict.reason}`)]
			: ['Conflicts: none']),
		...formatReferences(references),
	]
	return lines.join('\n')
}
