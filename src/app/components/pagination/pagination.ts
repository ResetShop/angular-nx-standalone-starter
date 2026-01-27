import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { featherChevronLeft, featherChevronRight } from '@ng-icons/feather-icons';
import { Button } from '@components/button/button';

@Component({
	selector: 'app-pagination',
	standalone: true,
	imports: [Button, NgIcon],
	viewProviders: [provideIcons({ featherChevronLeft, featherChevronRight })],
	template: `
		<nav aria-label="Pagination" class="flex items-center justify-between gap-4">
			<p class="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
				Showing {{ showingFrom() }} to {{ showingTo() }} of {{ totalItems() }} results
			</p>

			<div class="flex items-center gap-2">
				<button
					appButton
					variant="outline"
					size="sm"
					[disabled]="isFirstPage()"
					[attr.aria-disabled]="isFirstPage()"
					aria-label="Go to previous page"
					(click)="onPrevious()"
				>
					<ng-icon name="featherChevronLeft" class="h-4 w-4" />
					<span class="ml-1">Previous</span>
				</button>

				<span class="text-sm text-gray-600 dark:text-gray-400">
					Page {{ currentPage() }} of {{ totalPages() }}
				</span>

				<button
					appButton
					variant="outline"
					size="sm"
					[disabled]="isLastPage()"
					[attr.aria-disabled]="isLastPage()"
					aria-label="Go to next page"
					(click)="onNext()"
				>
					<span class="mr-1">Next</span>
					<ng-icon name="featherChevronRight" class="h-4 w-4" />
				</button>
			</div>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
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

	/** First item number on current page */
	readonly showingFrom = computed(() => {
		if (this.totalItems() === 0) return 0;
		return (this.currentPage() - 1) * this.pageSize() + 1;
	});

	/** Last item number on current page */
	readonly showingTo = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

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
