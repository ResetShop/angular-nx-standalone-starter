import { BreakpointObserver } from '@angular/cdk/layout'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks, fn } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { of } from 'rxjs'
import { Pagination } from './pagination'

const TRANSLATIONS: Record<string, string> = {
	'PAGINATION.LABEL': 'Pagination',
	'PAGINATION.ROWS_PER_PAGE': 'Rows per page',
	'PAGINATION.GO_TO_PREVIOUS': 'Go to previous page',
	'PAGINATION.GO_TO_NEXT': 'Go to next page',
	'PAGINATION.GO_TO_PAGE': 'Go to page {page}',
	'PAGINATION.PAGE_OF': 'Page {current} of {total}',
}

const mockTranslation = {
	instant: (key: string, fallback?: string) => TRANSLATIONS[key] ?? fallback ?? key,
}

describe('Pagination', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	describe('rendering', () => {
		it('should render pagination navigation', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
		})

		it('should render rows per page selector with default options', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByLabelText(/rows per page/i)).toBeInTheDocument()
			expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument()
		})

		it('should render custom page size options', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5, pageSizeOptions: [10, 20, 30] },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: '20' })).toBeInTheDocument()
			expect(screen.getByRole('option', { name: '30' })).toBeInTheDocument()
		})

		it('should render previous and next buttons', async () => {
			await render(Pagination, {
				inputs: { currentPage: 2, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByRole('button', { name: /go to previous page/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /go to next page/i })).toBeInTheDocument()
		})
	})

	describe('page number buttons', () => {
		it('should show all pages when totalPages <= 4', async () => {
			await render(Pagination, {
				inputs: { currentPage: 2, totalPages: 4 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByRole('button', { name: /go to page 1/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /go to page 2/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /go to page 3/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /go to page 4/i })).toBeInTheDocument()
		})

		it('should show ellipsis when totalPages > 4 and at start', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 10 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			// Should show: 1, 2, …, 10
			expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument()
			expect(screen.getByText('…')).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
		})

		it('should show ellipsis on both sides when in middle', async () => {
			await render(Pagination, {
				inputs: { currentPage: 5, totalPages: 10 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			// Should show: 1, ..., 4, 5, 6, ..., 10
			expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 6' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
			expect(screen.getAllByText('…')).toHaveLength(2)
		})

		it('should show ellipsis only at start when near end', async () => {
			await render(Pagination, {
				inputs: { currentPage: 10, totalPages: 10 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			// Should show: 1, …, 9, 10
			expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
			expect(screen.getByText('…')).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 9' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
		})

		describe('ellipsis boundary cases (I.2 threshold fix)', () => {
			it('should show no leading ellipsis at currentPage=3 (1 2 3 4 … 10)', async () => {
				await render(Pagination, {
					inputs: { currentPage: 3, totalPages: 10 },
					providers: [{ provide: Translation, useValue: mockTranslation }],
				})

				expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument()
				expect(screen.queryByRole('button', { name: 'Go to page 5' })).not.toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
				expect(screen.getByText('…')).toBeInTheDocument()
				expect(screen.queryAllByText('…')).toHaveLength(1)
			})

			it('should show no leading ellipsis at currentPage=4 (1 2 3 4 5 … 10)', async () => {
				await render(Pagination, {
					inputs: { currentPage: 4, totalPages: 10 },
					providers: [{ provide: Translation, useValue: mockTranslation }],
				})

				expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument()
				expect(screen.queryByRole('button', { name: 'Go to page 6' })).not.toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
				expect(screen.getByText('…')).toBeInTheDocument()
				expect(screen.queryAllByText('…')).toHaveLength(1)
			})

			it('should show ellipsis on both sides at currentPage=5 (1 … 4 5 6 … 10)', async () => {
				await render(Pagination, {
					inputs: { currentPage: 5, totalPages: 10 },
					providers: [{ provide: Translation, useValue: mockTranslation }],
				})

				expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
				expect(screen.queryByRole('button', { name: 'Go to page 2' })).not.toBeInTheDocument()
				expect(screen.queryByRole('button', { name: 'Go to page 3' })).not.toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 6' })).toBeInTheDocument()
				expect(screen.queryByRole('button', { name: 'Go to page 7' })).not.toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
				expect(screen.getAllByText('…')).toHaveLength(2)
			})

			it('should show ellipsis on both sides at currentPage=6 (1 … 5 6 7 … 10)', async () => {
				await render(Pagination, {
					inputs: { currentPage: 6, totalPages: 10 },
					providers: [{ provide: Translation, useValue: mockTranslation }],
				})

				expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
				expect(screen.queryByRole('button', { name: 'Go to page 4' })).not.toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 6' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 7' })).toBeInTheDocument()
				expect(screen.queryByRole('button', { name: 'Go to page 8' })).not.toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
				expect(screen.getAllByText('…')).toHaveLength(2)
			})

			it('should show no trailing ellipsis at currentPage=7 (1 … 6 7 8 9 10)', async () => {
				await render(Pagination, {
					inputs: { currentPage: 7, totalPages: 10 },
					providers: [{ provide: Translation, useValue: mockTranslation }],
				})

				expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
				expect(screen.queryByRole('button', { name: 'Go to page 5' })).not.toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 6' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 7' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 8' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 9' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
				expect(screen.getByText('…')).toBeInTheDocument()
				expect(screen.queryAllByText('…')).toHaveLength(1)
			})

			it('should show no trailing ellipsis at currentPage=8 (1 … 7 8 9 10)', async () => {
				await render(Pagination, {
					inputs: { currentPage: 8, totalPages: 10 },
					providers: [{ provide: Translation, useValue: mockTranslation }],
				})

				expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
				expect(screen.queryByRole('button', { name: 'Go to page 6' })).not.toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 7' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 8' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 9' })).toBeInTheDocument()
				expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
				expect(screen.getByText('…')).toBeInTheDocument()
				expect(screen.queryAllByText('…')).toHaveLength(1)
			})
		})

		it('should mark current page with aria-current', async () => {
			await render(Pagination, {
				inputs: { currentPage: 3, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const currentPageButton = screen.getByRole('button', { name: /go to page 3/i })
			expect(currentPageButton).toHaveAttribute('aria-current', 'page')
		})
	})

	describe('navigation', () => {
		it('should disable previous button on first page', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const prevButton = screen.getByRole('button', { name: /go to previous page/i })
			expect(prevButton).toHaveAttribute('aria-disabled', 'true')
		})

		it('should disable next button on last page', async () => {
			await render(Pagination, {
				inputs: { currentPage: 5, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const nextButton = screen.getByRole('button', { name: /go to next page/i })
			expect(nextButton).toHaveAttribute('aria-disabled', 'true')
		})

		it('should enable both buttons on middle page', async () => {
			await render(Pagination, {
				inputs: { currentPage: 3, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByRole('button', { name: /go to previous page/i })).toHaveAttribute('aria-disabled', 'false')
			expect(screen.getByRole('button', { name: /go to next page/i })).toHaveAttribute('aria-disabled', 'false')
		})

		it('should emit pageChange with previous page on previous click', async () => {
			const user = userEvent.setup()
			const pageChangeSpy = fn<[number], void>()

			await render(Pagination, {
				inputs: { currentPage: 3, totalPages: 5 },
				on: { pageChange: pageChangeSpy },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			await user.click(screen.getByRole('button', { name: /go to previous page/i }))

			expect(pageChangeSpy.calls).toContainEqual([2])
		})

		it('should emit pageChange with next page on next click', async () => {
			const user = userEvent.setup()
			const pageChangeSpy = fn<[number], void>()

			await render(Pagination, {
				inputs: { currentPage: 2, totalPages: 5 },
				on: { pageChange: pageChangeSpy },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			await user.click(screen.getByRole('button', { name: /go to next page/i }))

			expect(pageChangeSpy.calls).toContainEqual([3])
		})

		it('should emit pageChange when clicking page number', async () => {
			const user = userEvent.setup()
			const pageChangeSpy = fn<[number], void>()

			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				on: { pageChange: pageChangeSpy },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			// At currentPage=1, totalPages=5: sequence is [1, 2, …, 5] — page 2 is a visible non-current page
			await user.click(screen.getByRole('button', { name: /go to page 2/i }))

			expect(pageChangeSpy.calls).toContainEqual([2])
		})

		it('should not emit pageChange when clicking current page', async () => {
			const user = userEvent.setup()
			const pageChangeSpy = fn<[number], void>()

			await render(Pagination, {
				inputs: { currentPage: 2, totalPages: 5 },
				on: { pageChange: pageChangeSpy },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			await user.click(screen.getByRole('button', { name: /go to page 2/i }))

			expect(pageChangeSpy.calls).toHaveLength(0)
		})

		it('should not emit pageChange when clicking disabled previous button', async () => {
			const user = userEvent.setup()
			const pageChangeSpy = fn<[number], void>()

			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				on: { pageChange: pageChangeSpy },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			await user.click(screen.getByRole('button', { name: /go to previous page/i }))

			expect(pageChangeSpy.calls).toHaveLength(0)
		})

		it('should not emit pageChange when clicking disabled next button', async () => {
			const user = userEvent.setup()
			const pageChangeSpy = fn<[number], void>()

			await render(Pagination, {
				inputs: { currentPage: 5, totalPages: 5 },
				on: { pageChange: pageChangeSpy },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			await user.click(screen.getByRole('button', { name: /go to next page/i }))

			expect(pageChangeSpy.calls).toHaveLength(0)
		})
	})

	describe('page size selection', () => {
		it('should emit pageSizeChange when selecting new page size', async () => {
			const user = userEvent.setup()
			const pageSizeChangeSpy = fn<[number], void>()

			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5, pageSize: 25 },
				on: { pageSizeChange: pageSizeChangeSpy },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			await user.selectOptions(screen.getByLabelText(/rows per page/i), '50')

			expect(pageSizeChangeSpy.calls).toContainEqual([50])
		})

		it('should show current page size as selected', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5, pageSize: 50 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const select = screen.getByLabelText(/rows per page/i) as HTMLSelectElement
			expect(select.value).toBe('50')
		})
	})

	describe('edge cases', () => {
		it('should handle single page', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 1 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByRole('button', { name: /go to page 1/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /go to previous page/i })).toHaveAttribute('aria-disabled', 'true')
			expect(screen.getByRole('button', { name: /go to next page/i })).toHaveAttribute('aria-disabled', 'true')
		})

		it('should handle two pages', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 2 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByRole('button', { name: /go to page 1/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /go to page 2/i })).toBeInTheDocument()
			expect(screen.queryByText('…')).not.toBeInTheDocument()
		})

		it('should handle exactly 5 pages (boundary case)', async () => {
			await render(Pagination, {
				inputs: { currentPage: 3, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			// With 5 pages and current at 3, shows all pages 1–5 (no ellipsis — thresholds not reached)
			// current > 4 → false (no leading ellipsis); current < total - 3 = 2 → false (no trailing ellipsis)
			expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument()
		})
	})

	describe('responsive layout', () => {
		it('should be a single-row layout at all viewports', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const nav = screen.getByRole('navigation', { name: /pagination/i })
			expect(nav).toHaveClass('flex')
			expect(nav).toHaveClass('items-center')
			expect(nav).toHaveClass('justify-between')
			expect(nav).not.toHaveClass('flex-col')
		})

		it('should mark the rows-per-page label sr-only on mobile, visible from sm: up', async () => {
			// jsdom cannot evaluate media queries; this asserts class presence as a regression guard.
			// Visual breakpoint behaviour is covered by the 'Mobile' Storybook story.
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const label = screen.getByText('Rows per page')
			expect(label).toHaveClass('sr-only')
			expect(label).toHaveClass('sm:not-sr-only')
		})

		it('should not carry hidden/sm:inline-flex classes on page-number buttons (data-level trim replaces CSS hide)', async () => {
			// jsdom cannot evaluate media queries; class-presence assertions act as regression guards.
			// Visual breakpoint behaviour is covered by the 'Mobile' Storybook story.
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const pageBtn = screen.getByRole('button', { name: /go to page 1/i })
			expect(pageBtn).not.toHaveClass('hidden')
			expect(pageBtn).not.toHaveClass('sm:inline-flex')
		})

		it('should render page-number buttons with inline-flex class', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const pageBtn = screen.getByRole('button', { name: /go to page 1/i })
			expect(pageBtn).toHaveClass('inline-flex')
		})

		it('should keep the current-page label sr-only at all viewports', async () => {
			await render(Pagination, {
				inputs: { currentPage: 3, totalPages: 10 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const label = screen.getByText('Page 3 of 10')
			expect(label).toBeInTheDocument()
			expect(label).toHaveClass('sr-only')
		})

		it('should apply role="status", aria-live polite, and aria-atomic to the current-page label', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const label = screen.getByText('Page 1 of 5')
			expect(label).toHaveAttribute('role', 'status')
			expect(label).toHaveAttribute('aria-live', 'polite')
			expect(label).toHaveAttribute('aria-atomic', 'true')
		})

		it('should reflect updated currentPage input in the current-page label (computed signal reactivity)', async () => {
			const { rerender } = await render(Pagination, {
				inputs: { currentPage: 2, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()

			await rerender({ inputs: { currentPage: 4, totalPages: 5 } })

			expect(screen.getByText('Page 4 of 5')).toBeInTheDocument()
			expect(screen.queryByText('Page 2 of 5')).not.toBeInTheDocument()
		})

		it('should apply data-touch-target to the previous button', async () => {
			await render(Pagination, {
				inputs: { currentPage: 2, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByRole('button', { name: /go to previous page/i })).toHaveAttribute('data-touch-target')
		})

		it('should apply data-touch-target to the next button', async () => {
			await render(Pagination, {
				inputs: { currentPage: 2, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			expect(screen.getByRole('button', { name: /go to next page/i })).toHaveAttribute('data-touch-target')
		})

		it('should apply text-base sm:text-sm to the rows-per-page select for iOS zoom-on-focus prevention', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			})

			const select = screen.getByLabelText(/rows per page/i)
			expect(select).toHaveClass('text-base')
			expect(select).toHaveClass('sm:text-sm')
		})
	})

	describe('mobile page item cap (I.1)', () => {
		const mobileObserver = { observe: () => of({ matches: true, breakpoints: {} }) }
		const desktopObserver = { observe: () => of({ matches: false, breakpoints: {} }) }

		it('should trim pageItems to at most 4 items on mobile viewports', async () => {
			await render(Pagination, {
				inputs: { currentPage: 5, totalPages: 10 },
				providers: [
					{ provide: Translation, useValue: mockTranslation },
					{ provide: BreakpointObserver, useValue: mobileObserver },
				],
			})

			// Full sequence at currentPage=5: [page1, …, page4, page5, page6, …, page10] (7 items)
			// Sliced to 4: [page1, ellipsis, page4, page5]
			expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument()
			expect(screen.queryByRole('button', { name: 'Go to page 6' })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: 'Go to page 10' })).not.toBeInTheDocument()
			expect(screen.getAllByText('…')).toHaveLength(1)
		})

		it('should show all pageItems on desktop viewports (above sm breakpoint)', async () => {
			await render(Pagination, {
				inputs: { currentPage: 5, totalPages: 10 },
				providers: [
					{ provide: Translation, useValue: mockTranslation },
					{ provide: BreakpointObserver, useValue: desktopObserver },
				],
			})

			expect(screen.getByRole('button', { name: 'Go to page 6' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
			expect(screen.getAllByText('…')).toHaveLength(2)
		})
	})

	describe('fallback strings (no Translation provider)', () => {
		// Provide a Translation stub that mirrors the real service's "no translations loaded"
		// path: when a fallback is supplied, return it; otherwise return the raw key.
		const fallbackProvider = {
			provide: Translation,
			useValue: { instant: (key: string, fallback?: string) => fallback ?? key },
		}

		it('should render "Pagination" nav aria-label when translations are not loaded (LABEL)', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [fallbackProvider],
			})

			expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
		})

		it('should render "Rows per page" label when translations are not loaded (ROWS_PER_PAGE)', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [fallbackProvider],
			})

			// getByLabelText verifies both the rendered text AND the `for`/`id` association
			// between the <label> and its <select>, per the project's query priority rules.
			expect(screen.getByLabelText('Rows per page')).toBeInTheDocument()
		})

		it('should render "Go to previous page" aria-label when translations are not loaded (GO_TO_PREVIOUS)', async () => {
			await render(Pagination, {
				inputs: { currentPage: 2, totalPages: 5 },
				providers: [fallbackProvider],
			})

			expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeInTheDocument()
		})

		it('should render "Go to next page" aria-label when translations are not loaded (GO_TO_NEXT)', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [fallbackProvider],
			})

			expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument()
		})

		it('should render interpolated "Go to page N" aria-label when translations are not loaded (GO_TO_PAGE)', async () => {
			await render(Pagination, {
				inputs: { currentPage: 1, totalPages: 5 },
				providers: [fallbackProvider],
			})

			expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
		})

		it('should render interpolated "Page N of M" sr-only label when translations are not loaded (PAGE_OF)', async () => {
			await render(Pagination, {
				inputs: { currentPage: 3, totalPages: 10 },
				providers: [fallbackProvider],
			})

			expect(screen.getByText('Page 3 of 10')).toBeInTheDocument()
		})
	})
})
