import { Component, effect, inject, input, output, signal } from '@angular/core'
import { type Language, Translation } from '@providers/i18n/translation'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import { Pagination } from './pagination'

/**
 * Wrapper component that manages language loading and interactive state for Pagination stories.
 * Destroys and re-creates the Pagination when language changes so that
 * translated defaults pick up the new locale.
 */
@Component({
	selector: 'app-pagination-story',
	standalone: true,
	imports: [Pagination],
	template: `
		@if (isReady()) {
			<app-pagination
				(pageChange)="onPageChange($event)"
				(pageSizeChange)="onPageSizeChange($event)"
				[currentPage]="currentPageState()"
				[totalPages]="totalPages()"
				[pageSize]="pageSizeState()"
				[pageSizeOptions]="pageSizeOptions()"
			/>
		}
	`,
})
class PaginationStoryComponent {
	private readonly translation = inject(Translation)

	readonly totalPages = input(10)
	readonly initialPage = input(1)
	readonly initialPageSize = input(25)
	readonly pageSizeOptions = input<number[]>([25, 50, 100])
	readonly language = input<Language>('en')
	readonly pageChange = output<number>()
	readonly pageSizeChange = output<number>()

	/** Internal state for current page (allows interactive navigation in stories) */
	readonly currentPageState = signal(1)

	/** Internal state for page size (allows interactive changes in stories) */
	readonly pageSizeState = signal(25)

	/**
	 * Tracks when translations are loaded and ready for use.
	 * Toggling this signal forces the Pagination to re-mount with updated translations.
	 */
	readonly isReady = signal(false)

	constructor() {
		// Initialize state from inputs and handle language changes
		effect(() => {
			this.currentPageState.set(this.initialPage())
			this.pageSizeState.set(this.initialPageSize())

			const lang = this.language()
			this.isReady.set(false)
			this.translation.setLanguage(lang).then(() => {
				this.isReady.set(true)
			})
		})
	}

	onPageChange(page: number): void {
		this.currentPageState.set(page)
		this.pageChange.emit(page)
	}

	onPageSizeChange(size: number): void {
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
	decorators: [
		applicationConfig({
			providers: [Translation],
		}),
	],
	parameters: {
		docs: {
			description: {
				component: `
A pagination component following shadcn/ui patterns for navigating through paged data.

## Features

- **Rows Per Page Selector**: Left-aligned dropdown to select 25, 50, or 100 rows per page
- **Page Number Buttons**: Direct navigation to specific pages with intelligent ellipsis
- **Previous/Next Navigation**: Ghost variant buttons for sequential navigation
- **Accessible**: Proper ARIA labels, keyboard navigation, and screen reader support
- **i18n Support**: All labels are localized using the Translation service

## Page Number Logic

The component intelligently displays page numbers:
- **4 or fewer pages**: Shows all page numbers
- **5+ pages**: Shows first page, ellipsis, middle pages around current, ellipsis, last page
- **At start (page 1-3)**: Shows 1, 2, 3, ..., last
- **In middle**: Shows 1, ..., prev, current, next, ..., last
- **At end**: Shows 1, ..., last-2, last-1, last

## Language Support

Use the **language** control to switch between:
- **en** (English) - Default
- **es** (Spanish)

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
		},
	},
	argTypes: {
		language: {
			control: 'select',
			options: ['en', 'es'],
			description: 'Language for translated messages',
			table: {
				type: { summary: 'Language' },
				defaultValue: { summary: 'en' },
			},
		},
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
		language: 'en',
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
		language: 'en',
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
		language: 'en',
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
		language: 'en',
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
		language: 'en',
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
		language: 'en',
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
		language: 'en',
	},
}

/**
 * Spanish language variant.
 * All labels are translated to Spanish.
 */
export const SpanishLanguage: Story = {
	args: {
		totalPages: 10,
		initialPage: 5,
		initialPageSize: 25,
		language: 'es',
	},
}
