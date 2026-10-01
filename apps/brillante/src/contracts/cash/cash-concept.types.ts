export interface TransactionTypeDto {
	id: number
	description: string
}

/**
 * A node of the cash concept tree. Root concepts have `parent: null` and list their `children`;
 * only concepts flagged `userAssignable` can be picked on a transaction.
 */
export interface TransactionConceptDto {
	id: number
	description: string
	transactionType: TransactionTypeDto
	parent: TransactionConceptDto | null
	children: TransactionConceptDto[]
	userAssignable: boolean
	enabled: boolean
	modifiable: boolean
}

export type SaveTransactionConceptRequest = Partial<TransactionConceptDto> & Pick<TransactionConceptDto, 'description'>
