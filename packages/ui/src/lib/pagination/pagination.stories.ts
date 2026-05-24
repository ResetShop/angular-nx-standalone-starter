import { Component, effect, input, output, signal } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular'
import { Pagination } from './pagination'

/**
 * Wrapper component that manages interactive state for Pagination stories.
 */
@Component({
	selector: 'app-pagination-story',
	standalone: true,
	imports: [Pagination],
	template: `
		<app-pagination
			(pageChange)="onPageChange($event)"
			(pageSizeChange)="onPageSizeChange($event)"
			[currentPage]="currentPageState()"
			[totalPages]="totalPages()"
			[pageSize]="pageSizeState()"
			[pageSizeOptions]="pageSizeOptions()"
		/>
	`,
})
class PaginationStoryComponent {
	public readonly totalPages = input(10)
	public readonly initialPage = input(1)
	public readonly initialPageSize = input(25)
	public readonly pageSizeOptions = input<number[]>([25, 50, 100])
	public readonly pageChange = output<number>()
	public readonly pageSizeChange = output<number>()

	/** Internal state for current page (allows interactive navigation in stories) */
	protected readonly currentPageState = signal(1)

	/** Internal state for page size (allows interactive changes in stories) */
	protected readonly pageSizeState = signal(25)

	// Initialize state from inputs
	private readonly syncInitialStateEffect = effect(() => {
		this.currentPageState.set(this.initialPage())
		this.pageSizeState.set(this.initialPageSize())
	})

	protected onPageChange(page: number): void {
		this.currentPageState.set(page)
		this.pageChange.emit(page)
	}

	protected onPageSizeChange(size: number): void {
		this.pageSizeState.set(size)
		// Reset to page 1 when page size changes (common UX pattern)
		this.currentPageState.set(1)
		this.pageSizeChange.emit(size)
	}
}

const meta: Meta<PaginationStoryComponent> = {
	component: PaginationStoryComponent,
	title: 'Components/Pagination',
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: `
A pagination component following shadcn/ui patterns for navigating through paged data.

## Features

- **Rows Per Page Selector**: Stacks on top on mobile, left-aligned alongside the page navigation from \`sm:\` up
- **Responsive Layout**: Below the \`sm:\` breakpoint, page-number items are trimmed to at most 4 at the data level via \`createBreakpointSignal\`; the rows-per-page label becomes sr-only. An \`aria-live\` "Page N of M" label provides screen-reader context at all viewports.
- **Touch Targets**: Prev/next buttons carry \`data-touch-target\` to extend the hit area to 44 px on mobile
- **Page Number Buttons**: Direct navigation to specific pages with intelligent ellipsis
- **Previous/Next Navigation**: Ghost variant buttons for sequential navigation
- **Accessible**: Proper ARIA labels, keyboard navigation, and screen reader support

## Page Number Logic

The component intelligently displays page numbers:
- **4 or fewer pages**: Shows all page numbers
- **5+ pages**: Shows first page, ellipsis, middle pages around current, ellipsis, last page
- **At start (page 1-4)**: Shows pages up to \`current+1\`, then ellipsis, then last (e.g., page 4 → \`1 2 3 4 5 … last\`)
- **In middle**: Shows 1, ..., prev, current, next, ..., last
- **At end**: Shows 1, ..., last-2, last-1, last

## Usage

\`\`\`html
<app-pagination
  [currentPage]="currentPage"
  [totalPages]="totalPages"
  [pageSize]="pageSize"
  [pageSizeOptions]="[25, 50, 100]"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)"
/>
\`\`\`
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
	argTypes: {
		totalPages: {
			control: { type: 'number', min: 1 },
			description: 'Total number of pages',
			table: { defaultValue: { summary: '10' } },
		},
		initialPage: {
			control: { type: 'number', min: 1 },
			description: 'Initial page number (1-based)',
			table: { defaultValue: { summary: '1' } },
		},
		initialPageSize: {
			control: { type: 'number', min: 1 },
			description: 'Initial page size',
			table: { defaultValue: { summary: '25' } },
		},
		pageSizeOptions: {
			control: 'object',
			description: 'Available page-size choices shown in the rows-per-page select',
			table: { defaultValue: { summary: '[25, 50, 100]' } },
		},
	},
}

export default meta

type Story = StoryObj<PaginationStoryComponent>

/**
 * Default pagination at page 1 with 10 total pages.
 * Shows: [1] [2] [3] ... [10]
 */
export const Default: Story = {
	args: {
		totalPages: 10,
		initialPage: 1,
		initialPageSize: 25,
	},
}

/**
 * Pagination in the middle of a large dataset.
 * Shows ellipsis on both sides: [1] ... [4] [5] [6] ... [10]
 */
export const MiddlePage: Story = {
	args: {
		totalPages: 10,
		initialPage: 5,
		initialPageSize: 25,
	},
}

/**
 * Pagination at the last page.
 * Shows: [1] ... [8] [9] [10]
 */
export const LastPage: Story = {
	args: {
		totalPages: 10,
		initialPage: 10,
		initialPageSize: 25,
	},
}

/**
 * Small dataset with 4 or fewer pages (no ellipsis needed).
 * Shows all page numbers: [1] [2] [3] [4]
 */
export const FewPages: Story = {
	args: {
		totalPages: 4,
		initialPage: 2,
		initialPageSize: 25,
	},
}

/**
 * Single page — both navigation buttons disabled.
 */
export const SinglePage: Story = {
	args: {
		totalPages: 1,
		initialPage: 1,
		initialPageSize: 25,
	},
}

/**
 * Large dataset with many pages.
 * Demonstrates the ellipsis behavior with 100 pages.
 */
export const ManyPages: Story = {
	args: {
		totalPages: 100,
		initialPage: 50,
		initialPageSize: 25,
	},
}

/**
 * Custom page size options.
 * Demonstrates different rows per page choices.
 */
export const CustomPageSizeOptions: Story = {
	args: {
		totalPages: 20,
		initialPage: 1,
		initialPageSize: 10,
		pageSizeOptions: [10, 20, 50, 100],
	},
}

/**
 * Mobile viewport (375px) — single-row layout. Page-number items are trimmed to
 * at most 4 at the data level (first 4 of the computed window). The rows-per-page
 * label becomes sr-only. Prev/next carry `data-touch-target`.
 */
export const Mobile: Story = {
	args: {
		totalPages: 10,
		initialPage: 5,
		initialPageSize: 25,
	},
	parameters: {
		viewport: {
			defaultViewport: 'mobile',
		},
	},
}
