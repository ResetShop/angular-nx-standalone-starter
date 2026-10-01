import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'

/**
 * Concepts a user may pick when creating a transaction: enabled, user-assignable roots that keep
 * at least one enabled, user-assignable child. Children that do not qualify are dropped.
 */
export function selectAssignableConcepts(tree: readonly TransactionConceptDto[]): TransactionConceptDto[] {
	return tree
		.filter((parent) => parent.userAssignable && parent.enabled)
		.map((parent) => ({
			...parent,
			children: parent.children.filter((child) => child.userAssignable && child.enabled),
		}))
		.filter((parent) => parent.children.length > 0)
}
