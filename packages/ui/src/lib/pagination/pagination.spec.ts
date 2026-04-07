import { Translation } from '@resetshop/angular-core/i18n/translation'
import { fn } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { Pagination } from './pagination'

const TRANSLATIONS: Record<string, string> = {
	'PAGINATION.LABEL': 'Pagination',
	'PAGINATION.ROWS_PER_PAGE': 'Rows per page',
	'PAGINATION.GO_TO_PREVIOUS': 'Go to previous page',
	'PAGINATION.GO_TO_NEXT': 'Go to next page',
	'PAGINATION.GO_TO_PAGE': 'Go to page {page}',
}

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
}

describe('Pagination', () => {
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

			// Should show: 1, 2, 3, ..., 10
			expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument()
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

			// Should show: 1, ..., 8, 9, 10
			expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
			expect(screen.getByText('…')).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 8' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 9' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
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

			await user.click(screen.getByRole('button', { name: /go to page 3/i }))

			expect(pageChangeSpy.calls).toContainEqual([3])
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

			// With 5 pages and current at 3, should show: 1, ..., 2, 3, 4, ..., 5
			// But since 5 > 4, it will use the ellipsis logic
			expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument()
		})
	})
})
