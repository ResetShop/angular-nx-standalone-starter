import { createMockConceptDto, createMockConceptTree } from '@mocks/cash-concept-dto.mock'
import {
	findConceptDto,
	flattenManagedConcepts,
	mapConceptTree,
	toCreateConceptRequest,
	toUpdateConceptRequest,
} from './cash-concept.mapper'

describe('cash concept mapper', () => {
	const sales = createMockConceptTree({ id: 1, description: 'Sales' }, [
		{ id: 11, description: 'Phones', modifiable: false },
		{ id: 12, description: 'System', userAssignable: false },
	])
	const register = createMockConceptDto({ id: 2, description: 'Register', userAssignable: false })

	describe('mapConceptTree', () => {
		it('should map roots together with their subconcepts', () => {
			const [root] = mapConceptTree([sales])

			expect(root).toMatchObject({
				id: 1,
				description: 'Sales',
				transactionTypeId: 1,
				parentId: null,
				parentDescription: null,
			})
			expect(root.children.map((child) => child.id)).toEqual([11, 12])
			expect(root.children[0]).toMatchObject({ parentId: 1, parentDescription: 'Sales', modifiable: false })
		})

		it('should only start trees from entries without a parent', () => {
			const orphan = createMockConceptDto({ id: 99, parent: sales })

			expect(mapConceptTree([sales, orphan]).map((concept) => concept.id)).toEqual([1])
		})

		it('should tolerate concepts without a children list', () => {
			const concept = { ...createMockConceptDto({ id: 5 }), children: undefined } as unknown as typeof sales

			expect(mapConceptTree([concept])[0].children).toEqual([])
		})
	})

	describe('flattenManagedConcepts', () => {
		it('should list assignable concepts with their assignable subconcepts', () => {
			const rows = flattenManagedConcepts(mapConceptTree([sales, register]))

			expect(rows.map((row) => [row.id, row.level])).toEqual([
				[1, 0],
				[11, 1],
			])
		})

		it('should return nothing for an empty tree', () => {
			expect(flattenManagedConcepts([])).toEqual([])
		})
	})

	describe('findConceptDto', () => {
		it('should find a root concept', () => {
			expect(findConceptDto([sales], 1)?.description).toBe('Sales')
		})

		it('should find a nested subconcept', () => {
			expect(findConceptDto([sales], 12)?.description).toBe('System')
		})

		it('should return null when the concept does not exist', () => {
			expect(findConceptDto([sales], 404)).toBeNull()
		})
	})

	describe('toCreateConceptRequest', () => {
		it('should build a top level concept of the drafted type, always assignable', () => {
			const request = toCreateConceptRequest(
				{ description: ' Rent ', transactionTypeId: 0, parentId: null, userAssignable: false, modifiable: true },
				null,
			)

			expect(request).toEqual({
				description: 'Rent',
				transactionType: { id: 0, description: 'Egreso' },
				parent: null,
				children: [],
				userAssignable: true,
				modifiable: true,
				enabled: true,
			})
		})

		it('should build a subconcept that takes the type of its parent and drops the parent children', () => {
			const request = toCreateConceptRequest(
				{ description: 'Tablets', transactionTypeId: 0, parentId: 1, userAssignable: false, modifiable: false },
				sales,
			)

			expect(request.transactionType).toEqual(sales.transactionType)
			expect(request.parent).toMatchObject({ id: 1, children: [] })
			expect(request.userAssignable).toBe(false)
			expect(request.modifiable).toBe(false)
		})
	})

	describe('toUpdateConceptRequest', () => {
		it('should apply the changes on top of the current concept', () => {
			const current = sales.children[0]

			const request = toUpdateConceptRequest(current, {
				id: 11,
				description: ' Mobiles ',
				userAssignable: false,
				modifiable: true,
			})

			expect(request).toMatchObject({ id: 11, description: 'Mobiles', userAssignable: false, modifiable: true })
			expect(request.parent).toEqual(current.parent)
		})

		it('should keep a top level concept assignable', () => {
			const request = toUpdateConceptRequest(sales, {
				id: 1,
				description: 'Sales',
				userAssignable: false,
				modifiable: true,
			})

			expect(request.userAssignable).toBe(true)
		})
	})
})
