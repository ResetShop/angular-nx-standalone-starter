import type { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { beforeEach, describe, expect, it } from 'vitest'

import drizzleSchemaGenerator from './index'

describe('drizzle-schema generator', () => {
	let tree: Tree

	beforeEach(() => {
		tree = createTreeWithEmptyWorkspace()
	})

	it('writes a single schema file directly under <directory>', async () => {
		await drizzleSchemaGenerator(tree, { name: 'product', directory: 'src/db/schema' })

		// drizzle-schema does NOT nest the file under a per-table directory —
		// the file lands directly under `directory`.
		expect(tree.exists('src/db/schema/product.ts')).toBe(true)
		expect(tree.exists('src/db/schema/product/product.ts')).toBe(false)
	})

	it('substitutes the propertyName form into pgTable identifier and exported names', async () => {
		await drizzleSchemaGenerator(tree, { name: 'product', directory: 'src/db/schema' })

		const schemaTs = tree.read('src/db/schema/product.ts')?.toString('utf-8') ?? ''
		expect(schemaTs).toContain(`export const product = pgTable('product', {`)
		expect(schemaTs).toContain('export const productRelations = relations(product, ({ many }) => ({')
		expect(schemaTs).toContain('export type Product = typeof product.$inferSelect')
		expect(schemaTs).toContain('export type NewProduct = typeof product.$inferInsert')
		expect(schemaTs).not.toContain('<%=')
	})

	it('uses the camelCase propertyName for both the filename and the pgTable identifier', async () => {
		// drizzle-schema/index.ts passes `name: n.propertyName` to generateFiles,
		// so the `__name__` filename placeholder AND the `<%= name %>` template
		// substitution both resolve to camelCase. Files land at `orderLineItem.ts`,
		// NOT `order-line-item.ts` — this differs from the store/api-provider
		// generators (which use n.fileName as the templateVar `name`). The test
		// asserts actual emitted output to lock the current behavior. Tracked as
		// follow-up bug in #330.
		await drizzleSchemaGenerator(tree, { name: 'orderLineItem', directory: 'src/db/schema' })

		expect(tree.exists('src/db/schema/orderLineItem.ts')).toBe(true)

		const schemaTs = tree.read('src/db/schema/orderLineItem.ts')?.toString('utf-8') ?? ''
		expect(schemaTs).toContain(`export const orderLineItem = pgTable('orderLineItem', {`)
		expect(schemaTs).toContain('export const orderLineItemRelations = relations(orderLineItem')
		expect(schemaTs).toContain('export type OrderLineItem = typeof orderLineItem.$inferSelect')
	})

	it('honours a non-default directory', async () => {
		await drizzleSchemaGenerator(tree, { name: 'product', directory: 'apps/foo/src/db/schema' })

		expect(tree.exists('apps/foo/src/db/schema/product.ts')).toBe(true)
		expect(tree.exists('src/db/schema/product.ts')).toBe(false)
	})
})
