import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import { selectAssignableConcepts } from './concept-options'

function concept(id: number, overrides: Partial<TransactionConceptDto> = {}): TransactionConceptDto {
	return {
		id,
		description: `Concept ${id}`,
		transactionType: { id: 1, description: 'Ingreso' },
		parent: null,
		children: [],
		userAssignable: true,
		enabled: true,
		modifiable: true,
		...overrides,
	}
}

describe('selectAssignableConcepts', () => {
	it('should keep enabled, assignable parents that have assignable children', () => {
		const result = selectAssignableConcepts([concept(1, { children: [concept(11), concept(12)] })])

		expect(result.map((parent) => parent.id)).toEqual([1])
		expect(result[0].children.map((child) => child.id)).toEqual([11, 12])
	})

	it('should drop parents that are not user assignable', () => {
		const tree = [concept(1, { userAssignable: false, children: [concept(11)] })]

		expect(selectAssignableConcepts(tree)).toEqual([])
	})

	it('should drop disabled parents', () => {
		const tree = [concept(1, { enabled: false, children: [concept(11)] })]

		expect(selectAssignableConcepts(tree)).toEqual([])
	})

	it('should drop children that are disabled or not user assignable', () => {
		const tree = [
			concept(1, { children: [concept(11), concept(12, { enabled: false }), concept(13, { userAssignable: false })] }),
		]

		expect(selectAssignableConcepts(tree)[0].children.map((child) => child.id)).toEqual([11])
	})

	it('should drop parents left without children', () => {
		const tree = [concept(1, { children: [concept(11, { enabled: false })] }), concept(2)]

		expect(selectAssignableConcepts(tree)).toEqual([])
	})

	it('should not mutate the source tree', () => {
		const tree = [concept(1, { children: [concept(11), concept(12, { enabled: false })] })]

		selectAssignableConcepts(tree)

		expect(tree[0].children).toHaveLength(2)
	})
})
