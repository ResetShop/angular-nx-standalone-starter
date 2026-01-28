import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Button } from '@components/button/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { featherChevronLeft, featherChevronRight } from '@ng-icons/feather-icons';
import { Translation } from '@providers/i18n/translation';

@Component({
	selector: 'app-pagination',
	standalone: true,
	imports: [Button, NgIcon],
	viewProviders: [provideIcons({ featherChevronLeft, featherChevronRight })],
	template: `
		<nav [attr.aria-label]="paginationLabel" class="flex items-center justify-between gap-4">
			<p class="text-sm text-gray-600 dark:text-gray-400" role="status" aria-live="polite">
				{{ showingResultsText() }}
			</p>

			<div class="flex items-center gap-2">
				<button
					(click)="onPrevious()"
					[disabled]="isFirstPage()"
					[attr.aria-disabled]="isFirstPage()"
					[attr.aria-label]="goToPreviousLabel"
					appButton
					variant="outline"
					size="sm"
				>
					<ng-icon name="featherChevronLeft" class="h-4 w-4" />
					<span class="ml-1">{{ previousLabel }}</span>
				</button>

				<span class="text-sm text-gray-600 dark:text-gray-400">
					{{ pageOfText() }}
				</span>

				<button
					(click)="onNext()"
					[disabled]="isLastPage()"
					[attr.aria-disabled]="isLastPage()"
					[attr.aria-label]="goToNextLabel"
					appButton
					variant="outline"
					size="sm"
				>
					<span class="mr-1">{{ nextLabel }}</span>
					<ng-icon name="featherChevronRight" class="h-4 w-4" />
				</button>
			</div>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
	private readonly translation = inject(Translation);

	/** Current page number (1-based) */
	readonly currentPage = input<number>(1);

	/** Total number of pages */
	readonly totalPages = input<number>(1);

	/** Total number of items across all pages */
	readonly totalItems = input<number>(0);

	/** Number of items per page */
	readonly pageSize = input<number>(10);

	/** Emits new page number when user navigates */
	readonly pageChange = output<number>();

	/**
	 * Translated nav aria-label, resolved once at construction.
	 * Not reactive to language changes — re-create the component to pick up a new locale.
	 */
	readonly paginationLabel = this.translation.instant('PAGINATION.LABEL');

	/**
	 * Translated template for showing results, resolved once at construction.
	 * Contains `{from}`, `{to}`, `{total}` placeholders interpolated by `showingResultsText`.
	 */
	private readonly showingResultsTemplate = this.translation.instant('PAGINATION.SHOWING_RESULTS');

	/**
	 * Translated "Previous" button text, resolved once at construction.
	 * Not reactive to language changes — re-create the component to pick up a new locale.
	 */
	readonly previousLabel = this.translation.instant('PAGINATION.PREVIOUS');

	/**
	 * Translated "Next" button text, resolved once at construction.
	 * Not reactive to language changes — re-create the component to pick up a new locale.
	 */
	readonly nextLabel = this.translation.instant('PAGINATION.NEXT');

	/**
	 * Translated template for page indicator, resolved once at construction.
	 * Contains `{page}`, `{total}` placeholders interpolated by `pageOfText`.
	 */
	private readonly pageOfTemplate = this.translation.instant('PAGINATION.PAGE_OF');

	/**
	 * Translated aria-label for the previous button, resolved once at construction.
	 * Not reactive to language changes — re-create the component to pick up a new locale.
	 */
	readonly goToPreviousLabel = this.translation.instant('PAGINATION.GO_TO_PREVIOUS');

	/**
	 * Translated aria-label for the next button, resolved once at construction.
	 * Not reactive to language changes — re-create the component to pick up a new locale.
	 */
	readonly goToNextLabel = this.translation.instant('PAGINATION.GO_TO_NEXT');

	/** First item number on current page (clamped to 0 minimum) */
	readonly showingFrom = computed(() => {
		if (this.totalItems() <= 0) return 0;
		return Math.max(1, (this.currentPage() - 1) * this.pageSize() + 1);
	});

	/** Last item number on current page (clamped to 0 minimum) */
	readonly showingTo = computed(() => Math.max(0, Math.min(this.currentPage() * this.pageSize(), this.totalItems())));

	/** Interpolated "Showing X to Y of Z results" text */
	readonly showingResultsText = computed(() =>
		this.showingResultsTemplate
			.replace('{from}', String(this.showingFrom()))
			.replace('{to}', String(this.showingTo()))
			.replace('{total}', String(this.totalItems())),
	);

	/** Interpolated "Page X of Y" text */
	readonly pageOfText = computed(() =>
		this.pageOfTemplate.replace('{page}', String(this.currentPage())).replace('{total}', String(this.totalPages())),
	);

	/** Whether current page is the first page */
	readonly isFirstPage = computed(() => this.currentPage() <= 1);

	/** Whether current page is the last page */
	readonly isLastPage = computed(() => this.currentPage() >= this.totalPages());

	onPrevious(): void {
		if (!this.isFirstPage()) {
			this.pageChange.emit(this.currentPage() - 1);
		}
	}

	onNext(): void {
		if (!this.isLastPage()) {
			this.pageChange.emit(this.currentPage() + 1);
		}
	}
}
