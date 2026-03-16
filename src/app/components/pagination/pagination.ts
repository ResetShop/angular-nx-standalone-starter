import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core'
import { Button } from '@components/button/button'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherChevronLeft, featherChevronRight } from '@ng-icons/feather-icons'
import { Translation } from '@providers/i18n/translation'
import { PaginationTracker } from './pagination-tracker'

/** Represents a page item in the pagination: a page number or an ellipsis */
interface PageItem {
	type: 'page' | 'ellipsis'
	value: number
}

const PAGINATION_KEYS = Object.freeze({
	LABEL: 'PAGINATION.LABEL',
	ROWS_PER_PAGE: 'PAGINATION.ROWS_PER_PAGE',
	GO_TO_PREVIOUS: 'PAGINATION.GO_TO_PREVIOUS',
	GO_TO_NEXT: 'PAGINATION.GO_TO_NEXT',
	GO_TO_PAGE: 'PAGINATION.GO_TO_PAGE',
} as const)

@Component({
	selector: 'app-pagination',
	standalone: true,
	imports: [Button, NgIcon],
	viewProviders: [provideIcons({ featherChevronLeft, featherChevronRight })],
	template: `
		<nav [attr.aria-label]="paginationLabel" class="flex items-center justify-between gap-4">
			<!-- Rows per page selector (left) -->
			<div class="flex items-center gap-2">
				<label [attr.for]="selectId" class="text-muted-foreground text-sm">
					{{ rowsPerPageLabel }}
				</label>
				<select
					(change)="onPageSizeChange($event)"
					[id]="selectId"
					[value]="pageSize()"
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-8 rounded-md border px-2 text-sm focus:ring-1 focus:outline-none"
				>
					@for (option of pageSizeOptions(); track option) {
						<option [value]="option" [selected]="option === pageSize()">{{ option }}</option>
					}
				</select>
			</div>

			<!-- Page navigation (right) -->
			<div class="flex items-center gap-1">
				<!-- Previous button -->
				<button
					(click)="onPrevious()"
					[disabled]="isFirstPage()"
					[attr.aria-disabled]="isFirstPage()"
					[attr.aria-label]="goToPreviousLabel"
					appButton
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
				>
					<ng-icon name="featherChevronLeft" class="h-4 w-4" />
				</button>

				<!-- Page number buttons -->
				@for (item of pageItems(); track $index) {
					@if (item.type === 'ellipsis') {
						<span class="text-muted-foreground flex h-8 w-8 items-center justify-center text-sm">…</span>
					} @else {
						<button
							(click)="onPageClick(item.value)"
							[variant]="item.value === currentPage() ? 'outline' : 'ghost'"
							[attr.aria-label]="getPageLabel(item.value)"
							[attr.aria-current]="item.value === currentPage() ? 'page' : null"
							appButton
							size="sm"
							class="h-8 w-8 p-0"
						>
							{{ item.value }}
						</button>
					}
				}

				<!-- Next button -->
				<button
					(click)="onNext()"
					[disabled]="isLastPage()"
					[attr.aria-disabled]="isLastPage()"
					[attr.aria-label]="goToNextLabel"
					appButton
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
				>
					<ng-icon name="featherChevronRight" class="h-4 w-4" />
				</button>
			</div>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
	private readonly translation = inject(Translation)
	private readonly paginationTracker = inject(PaginationTracker)

	/** Unique ID for the select element */
	protected readonly selectId = `pagination-select-${this.paginationTracker.nextId()}`

	/** Current page number (1-based) */
	public readonly currentPage = input<number>(1)

	/** Total number of pages */
	public readonly totalPages = input<number>(1)

	/** Number of items per page */
	public readonly pageSize = input<number>(25)

	/** Available page size options */
	public readonly pageSizeOptions = input<number[]>([25, 50, 100])

	/** Emits new page number when user navigates */
	public readonly pageChange = output<number>()

	/** Emits new page size when user changes the rows per page */
	public readonly pageSizeChange = output<number>()

	/**
	 * Translated nav aria-label, resolved once at construction.
	 * Not reactive to language changes — re-create the component to pick up a new locale.
	 */
	protected readonly paginationLabel = this.translation.instant(PAGINATION_KEYS.LABEL)

	/**
	 * Translated "Rows per page" label, resolved once at construction.
	 * Not reactive to language changes — re-create the component to pick up a new locale.
	 */
	protected readonly rowsPerPageLabel = this.translation.instant(PAGINATION_KEYS.ROWS_PER_PAGE)

	/**
	 * Translated aria-label for the previous button, resolved once at construction.
	 * Not reactive to language changes — re-create the component to pick up a new locale.
	 */
	protected readonly goToPreviousLabel = this.translation.instant(PAGINATION_KEYS.GO_TO_PREVIOUS)

	/**
	 * Translated aria-label for the next button, resolved once at construction.
	 * Not reactive to language changes — re-create the component to pick up a new locale.
	 */
	protected readonly goToNextLabel = this.translation.instant(PAGINATION_KEYS.GO_TO_NEXT)

	/**
	 * Translated template for page button aria-label, resolved once at construction.
	 * Contains `{page}` placeholder interpolated by `getPageLabel`.
	 */
	private readonly goToPageTemplate = this.translation.instant(PAGINATION_KEYS.GO_TO_PAGE)

	/** Whether current page is the first page */
	protected readonly isFirstPage = computed(() => this.currentPage() <= 1)

	/** Whether current page is the last page */
	protected readonly isLastPage = computed(() => this.currentPage() >= this.totalPages())

	/**
	 * Page items (numbers and ellipses) derived from current page and total pages.
	 *
	 * Logic:
	 * - If totalPages <= 4: show all pages
	 * - If totalPages > 4:
	 *   - Always show first page
	 *   - Show ellipsis if gap exists after first
	 *   - Show pages around current
	 *   - Show ellipsis if gap exists before last
	 *   - Always show last page
	 */
	protected readonly pageItems = computed<PageItem[]>(() => {
		const total = this.totalPages()
		const current = this.currentPage()

		if (total <= 4) {
			return this.range(1, total).map((n) => ({ type: 'page' as const, value: n }))
		}

		const items: PageItem[] = []
		const showLeftEllipsis = current > 3
		const showRightEllipsis = current < total - 2

		// Always show first page
		items.push({ type: 'page', value: 1 })

		if (showLeftEllipsis) {
			items.push({ type: 'ellipsis', value: -1 })
		}

		// Calculate middle pages to show
		let start: number
		let end: number

		if (current <= 3) {
			// Near the start: show 2, 3
			start = 2
			end = 3
		} else if (current >= total - 2) {
			// Near the end: show last-2, last-1
			start = total - 2
			end = total - 1
		} else {
			// In the middle: show current-1, current, current+1
			start = current - 1
			end = current + 1
		}

		for (let i = start; i <= end; i++) {
			if (i > 1 && i < total) {
				items.push({ type: 'page', value: i })
			}
		}

		if (showRightEllipsis) {
			items.push({ type: 'ellipsis', value: -2 })
		}

		// Always show last page
		items.push({ type: 'page', value: total })

		return items
	})

	/** Creates an array of numbers from start to end (inclusive) */
	private range(start: number, end: number): number[] {
		return Array.from({ length: end - start + 1 }, (_, i) => start + i)
	}

	/** Gets the aria-label for a page button */
	protected getPageLabel(page: number): string {
		return this.goToPageTemplate.replace('{page}', String(page))
	}

	/** Navigates to the previous page. No-op on the first page. */
	protected onPrevious(): void {
		if (!this.isFirstPage()) {
			this.pageChange.emit(this.currentPage() - 1)
		}
	}

	/** Navigates to the next page. No-op on the last page. */
	protected onNext(): void {
		if (!this.isLastPage()) {
			this.pageChange.emit(this.currentPage() + 1)
		}
	}

	/** Navigates to the specified page. No-op if it equals the current page. */
	protected onPageClick(page: number): void {
		if (page !== this.currentPage()) {
			this.pageChange.emit(page)
		}
	}

	/** Handles the page size select change and emits the new size. */
	protected onPageSizeChange(event: Event): void {
		const select = event.target as HTMLSelectElement
		const newSize = parseInt(select.value, 10)
		this.pageSizeChange.emit(newSize)
	}
}
