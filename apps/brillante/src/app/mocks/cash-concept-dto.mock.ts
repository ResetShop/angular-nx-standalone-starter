import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'

/**
 * Create a wire-format cash concept for API stubs. Override specific fields as needed.
 */
export function createMockConceptDto(overrides: Partial<TransactionConceptDto> = {}): TransactionConceptDto {
	return {
		id: 1,
		description: 'Sales',
		transactionType: { id: 1, description: 'Ingreso' },
		parent: null,
		children: [],
		userAssignable: true,
		enabled: true,
		modifiable: true,
		...overrides,
	}
}

/**
 * A root concept together with its subconcepts, the way `GET /cash/transaction/get` returns it.
 */
export function createMockConceptTree(
	root: Partial<TransactionConceptDto>,
	children: Partial<TransactionConceptDto>[],
): TransactionConceptDto {
	const parent = createMockConceptDto(root)
	return {
		...parent,
		children: children.map((child) =>
			createMockConceptDto({
				transactionType: parent.transactionType,
				...child,
				parent: { ...parent, children: [] },
			}),
		),
	}
}
