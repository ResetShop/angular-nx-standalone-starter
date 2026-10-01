import type { SaveTransactionConceptRequest, TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import { TRANSACTION_TYPES } from './cash-concept.constants'
import type { CashConcept, CashConceptChanges, CashConceptDraft, CashConceptRow } from './cash-concept.interface'

function mapConcept(dto: TransactionConceptDto, parent: TransactionConceptDto | null): CashConcept {
	return {
		id: dto.id,
		description: dto.description,
		transactionTypeId: dto.transactionType.id,
		parentId: parent?.id ?? null,
		parentDescription: parent?.description ?? null,
		userAssignable: dto.userAssignable,
		enabled: dto.enabled,
		modifiable: dto.modifiable,
		children: (dto.children ?? []).map((child) => mapConcept(child, dto)),
	}
}

/**
 * Maps the concept tree returned by the API. Only root entries of the response start a tree;
 * their subconcepts hang from `children`.
 */
export function mapConceptTree(tree: readonly TransactionConceptDto[]): CashConcept[] {
	return tree.filter((dto) => !dto.parent).map((dto) => mapConcept(dto, null))
}

/**
 * Flattens the managed part of the tree into table rows: user assignable top level concepts,
 * each followed by its user assignable subconcepts. System concepts (opening/closing the cash
 * register, for example) are not assignable and therefore never listed.
 */
export function flattenManagedConcepts(concepts: readonly CashConcept[]): CashConceptRow[] {
	return concepts
		.filter((concept) => concept.userAssignable)
		.flatMap((concept): CashConceptRow[] => [
			{ ...concept, level: 0 },
			...concept.children
				.filter((child) => child.userAssignable)
				.map((child): CashConceptRow => ({ ...child, level: 1 })),
		])
}

export function findConceptDto(tree: readonly TransactionConceptDto[], id: number): TransactionConceptDto | null {
	for (const dto of tree) {
		if (dto.id === id) return dto
		const nested = findConceptDto(dto.children ?? [], id)
		if (nested) return nested
	}
	return null
}

/**
 * Builds the creation payload. A subconcept inherits the transaction type of its parent, and a
 * top level concept is always assignable by the user.
 */
export function toCreateConceptRequest(
	draft: CashConceptDraft,
	parent: TransactionConceptDto | null,
): SaveTransactionConceptRequest {
	const type =
		parent?.transactionType ?? TRANSACTION_TYPES.find((candidate) => candidate.id === draft.transactionTypeId)
	return {
		description: draft.description.trim(),
		transactionType: type,
		parent: parent ? { ...parent, children: [] } : null,
		children: [],
		userAssignable: parent ? draft.userAssignable : true,
		modifiable: draft.modifiable,
		enabled: true,
	}
}

export function toUpdateConceptRequest(
	current: TransactionConceptDto,
	changes: CashConceptChanges,
): SaveTransactionConceptRequest {
	return {
		...current,
		description: changes.description.trim(),
		userAssignable: current.parent ? changes.userAssignable : true,
		modifiable: changes.modifiable,
	}
}
