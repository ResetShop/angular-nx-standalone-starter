export interface CashConcept {
	readonly id: number
	readonly description: string
	readonly transactionTypeId: number
	readonly parentId: number | null
	readonly parentDescription: string | null
	readonly userAssignable: boolean
	readonly enabled: boolean
	readonly modifiable: boolean
	readonly children: readonly CashConcept[]
}

/**
 * Values entered to create a concept (top level when `parentId` is null) or a subconcept.
 */
export interface CashConceptDraft {
	readonly description: string
	readonly transactionTypeId: number
	readonly parentId: number | null
	readonly userAssignable: boolean
	readonly modifiable: boolean
}

/**
 * The fields of an existing concept that can be edited; its type and parent never change.
 */
export interface CashConceptChanges {
	readonly id: number
	readonly description: string
	readonly userAssignable: boolean
	readonly modifiable: boolean
}

/**
 * One line of the concept management table: a top level concept or one of its subconcepts.
 */
export interface CashConceptRow extends CashConcept {
	readonly level: 0 | 1
}
