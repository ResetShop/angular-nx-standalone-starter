import type { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { beforeEach, describe, expect, it } from 'vitest'

import pageGenerator from './index'

const DEFAULT_DIR = 'src/app/pages/dashboard'

describe('page generator', () => {
	let tree: Tree

	beforeEach(() => {
		tree = createTreeWithEmptyWorkspace()
	})

	it('writes the list page files at <directory>/<fileName>/<fileName>-list/ when both flags are off', async () => {
		await pageGenerator(tree, {
			name: 'product',
			directory: DEFAULT_DIR,
			withApiProvider: false,
			withStore: false,
		})

		expect(tree.exists(`${DEFAULT_DIR}/product/product-list/product-list.ts`)).toBe(true)
		expect(tree.exists(`${DEFAULT_DIR}/product/product-list/product-list.spec.ts`)).toBe(true)
	})

	it('does NOT generate provider or store files when both flags are off', async () => {
		await pageGenerator(tree, {
			name: 'product',
			directory: DEFAULT_DIR,
			withApiProvider: false,
			withStore: false,
		})

		// Sub-generators must not run when their flag is false.
		expect(tree.exists('src/app/providers/product/product.ts')).toBe(false)
		expect(tree.exists('src/app/store/product/product.store.ts')).toBe(false)
	})

	it('substitutes className and fileName into the page component content', async () => {
		await pageGenerator(tree, {
			name: 'product',
			directory: DEFAULT_DIR,
			withApiProvider: false,
			withStore: false,
		})

		const pageTs = tree.read(`${DEFAULT_DIR}/product/product-list/product-list.ts`)?.toString('utf-8') ?? ''
		expect(pageTs).toContain(`selector: 'app-product-list'`)
		expect(pageTs).toContain(`[title]="'Product'"`)
		expect(pageTs).toContain('export default class ProductList')
		expect(pageTs).not.toContain('<%=')
	})

	it('substitutes className into the page spec content', async () => {
		await pageGenerator(tree, {
			name: 'product',
			directory: DEFAULT_DIR,
			withApiProvider: false,
			withStore: false,
		})

		const pageSpec = tree.read(`${DEFAULT_DIR}/product/product-list/product-list.spec.ts`)?.toString('utf-8') ?? ''
		expect(pageSpec).toContain(`import ProductList from './product-list'`)
		expect(pageSpec).toContain(`describe('ProductList'`)
		expect(pageSpec).not.toContain('<%=')
	})

	it('also generates the api-provider files at <directory>/../../providers/<fileName>/ when withApiProvider is true', async () => {
		await pageGenerator(tree, {
			name: 'product',
			directory: DEFAULT_DIR,
			withApiProvider: true,
			withStore: false,
		})

		// `joinPathFragments(directory, '../../providers')` resolves the `../../`
		// segments away — the provider files land at `src/app/providers/product/`.
		expect(tree.exists('src/app/providers/product/product.ts')).toBe(true)
		expect(tree.exists('src/app/providers/product/product.interface.ts')).toBe(true)
		expect(tree.exists('src/app/providers/product/product.provider.ts')).toBe(true)
	})

	it('also generates the store files at <directory>/../../store/<fileName>/ when withStore is true', async () => {
		await pageGenerator(tree, {
			name: 'product',
			directory: DEFAULT_DIR,
			withApiProvider: false,
			withStore: true,
		})

		expect(tree.exists('src/app/store/product/product.store.ts')).toBe(true)
		expect(tree.exists('src/app/store/product/product.types.ts')).toBe(true)
	})

	it('generates page, provider, and store when both flags are true', async () => {
		await pageGenerator(tree, {
			name: 'product',
			directory: DEFAULT_DIR,
			withApiProvider: true,
			withStore: true,
		})

		expect(tree.exists(`${DEFAULT_DIR}/product/product-list/product-list.ts`)).toBe(true)
		expect(tree.exists('src/app/providers/product/product.ts')).toBe(true)
		expect(tree.exists('src/app/store/product/product.store.ts')).toBe(true)
	})

	it('uses kebab-case for the outer page dir but camelCase for the inner __name__-list/ template dir', async () => {
		// Surfaced inconsistency between the outer and inner directory placeholders:
		// - The outer dir is `joinPathFragments(directory, n.fileName)` → kebab-case.
		// - The inner `__name__-list/` template-dir placeholder resolves via the
		//   templateVars `name` key, which `page/index.ts` sets to `n.propertyName`
		//   (camelCase), unlike `store`/`api-provider` which set `name` to `n.fileName`.
		// Net result: `<dir>/order-history/orderHistory-list/orderHistory-list.ts`.
		// This is a real generator inconsistency, but refactoring the generators is
		// out of scope per issue #317. The test asserts actual emitted output.
		await pageGenerator(tree, {
			name: 'orderHistory',
			directory: DEFAULT_DIR,
			withApiProvider: false,
			withStore: false,
		})

		expect(tree.exists(`${DEFAULT_DIR}/order-history/orderHistory-list/orderHistory-list.ts`)).toBe(true)
		expect(tree.exists(`${DEFAULT_DIR}/order-history/orderHistory-list/orderHistory-list.spec.ts`)).toBe(true)

		const pageTs =
			tree.read(`${DEFAULT_DIR}/order-history/orderHistory-list/orderHistory-list.ts`)?.toString('utf-8') ?? ''
		// Inside the template: `<%= fileName %>` resolves to kebab-case (`order-history`)
		// and `<%= className %>` to `OrderHistory` — those are independent of the
		// camelCase directory placeholder above, so the selector is correctly kebab.
		expect(pageTs).toContain(`selector: 'app-order-history-list'`)
		expect(pageTs).toContain(`[title]="'OrderHistory'"`)
		expect(pageTs).toContain('export default class OrderHistoryList')
	})

	it('honours a non-default directory and resolves the provider/store siblings via fixed `../../` segments', async () => {
		// Surfaced behaviour: the page generator computes provider/store paths as
		// `joinPathFragments(directory, '../../providers')` and `'../../store'`
		// — a literal two-level walk-up from the page directory. That works for
		// the default `src/app/pages/dashboard` (whose `../../` is `src/app/`),
		// but for a shallower `src/app/admin` the two levels resolve to `src/`.
		// This is a real generator coupling to the default directory depth.
		// Refactoring is out of scope for #317; the test asserts actual emitted
		// output to lock in the current behaviour and surface the regression
		// risk if anyone changes the path math.
		await pageGenerator(tree, {
			name: 'product',
			directory: 'src/app/admin',
			withApiProvider: true,
			withStore: true,
		})

		expect(tree.exists('src/app/admin/product/product-list/product-list.ts')).toBe(true)
		expect(tree.exists('src/providers/product/product.ts')).toBe(true)
		expect(tree.exists('src/store/product/product.store.ts')).toBe(true)
	})
})
