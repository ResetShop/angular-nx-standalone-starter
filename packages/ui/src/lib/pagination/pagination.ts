import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherChevronLeft, featherChevronRight } from '@ng-icons/feather-icons'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { Button } from '../button/button'
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
	PAGE_OF: 'PAGINATION.PAGE_OF',
} as const)

@Component({
	selector: 'app-pagination',
	standalone: true,
	imports: [Button, NgIcon],
	viewProviders: [provideIcons({ featherChevronLeft, featherChevronRight })],
	template: `
		<nav
			[attr.aria-label]="paginationLabel"
			class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
		>
			<!-- Rows per page selector (top on mobile, left on desktop) -->
			<div class="flex items-center gap-2">
				<label [attr.for]="selectId" class="text-muted-foreground text-sm">
					{{ rowsPerPageLabel }}
				</label>
				<select
					(change)="onPageSizeChange($event)"
					[id]="selectId"
					[value]="pageSize()"
					class="border-input bg-background text-foreground focus:border-ring focus:ring-ring h-8 rounded-md border px-2 text-base focus:ring-1 focus:outline-none sm:text-sm"
				>
					@for (option of pageSizeOptions(); track option) {
						<option [value]="option" [selected]="option === pageSize()">{{ option }}</option>
					}
				</select>
			</div>

			<!-- Page navigation (bottom on mobile, right on desktop) -->
			<div class="flex items-center gap-1">
				<!-- Previous button — data-touch-target extends hit area to 44px on mobile -->
				<button
					(click)="onPrevious()"
					[disabled]="isFirstPage()"
					[attr.aria-disabled]="isFirstPage()"
					[attr.aria-label]="goToPreviousLabel"
					appButton
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
					data-touch-target
				>
					<ng-icon name="featherChevronLeft" class="h-4 w-4" />
				</button>

				<!-- Mobile-only current-page indicator (hidden from sm: up where page buttons take over) -->
				<span
					aria-atomic="true"
					aria-live="polite"
					role="status"
					class="text-muted-foreground flex-1 text-center text-sm sm:hidden"
				>
					{{ pageOfLabel() }}
				</span>

				<!-- Page number buttons — hidden below sm: where the label above stands in -->
				@for (item of pageItems(); track $index) {
					@if (item.type === 'ellipsis') {
						<span class="text-muted-foreground hidden h-8 w-8 items-center justify-center text-sm sm:flex">…</span>
					} @else {
						<button
							(click)="onPageClick(item.value)"
							[variant]="item.value === currentPage() ? 'outline' : 'ghost'"
							[attr.aria-label]="getPageLabel(item.value)"
							[attr.aria-current]="item.value === currentPage() ? 'page' : null"
							appButton
							size="sm"
							class="hidden h-8 w-8 p-0 sm:inline-flex"
						>
							{{ item.value }}
						</button>
					}
				}

				<!-- Next button — data-touch-target extends hit area to 44px on mobile -->
				<button
					(click)="onNext()"
					[disabled]="isLastPage()"
					[attr.aria-disabled]="isLastPage()"
					[attr.aria-label]="goToNextLabel"
					appButton
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
					data-touch-target
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

	/**
	 * Translated template for the mobile current-page indicator, resolved once at construction.
	 * Contains `{current}` and `{total}` placeholders interpolated reactively by `pageOfLabel`.
	 */
	private readonly pageOfTemplate = this.translation.instant(PAGINATION_KEYS.PAGE_OF)

	/** Mobile current-page label (e.g. "Page 5 of 10"). Read by the `sm:hidden` `aria-live` span. */
	protected readonly pageOfLabel = computed(() =>
		this.pageOfTemplate.replace('{current}', String(this.currentPage())).replace('{total}', String(this.totalPages())),
	)

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
		items.push({ type: 'page', value: 1 })
		if (current > 3) items.push({ type: 'ellipsis', value: -1 })

		const [start, end] = this.middlePageRange(current, total)
		for (let i = start; i <= end; i++) {
			if (i > 1 && i < total) items.push({ type: 'page', value: i })
		}

		if (current < total - 2) items.push({ type: 'ellipsis', value: -2 })
		items.push({ type: 'page', value: total })
		return items
	})

	/**
	 * Returns the start and end indices of the middle-page window to show,
	 * excluding the always-visible first and last pages. The window is a
	 * 2-page span when the current page is near either edge, and a 3-page
	 * span centred on `current` when the current page is in the middle.
	 */
	private middlePageRange(current: number, total: number): [number, number] {
		if (current <= 3) return [2, 3]
		if (current >= total - 2) return [total - 2, total - 1]
		return [current - 1, current + 1]
	}

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
