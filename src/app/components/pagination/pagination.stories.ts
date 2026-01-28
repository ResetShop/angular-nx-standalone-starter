import { Component, effect, inject, input, output, signal } from '@angular/core';
import { type Language, Translation } from '@providers/i18n/translation';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { Pagination } from './pagination';

/**
 * Wrapper component that manages language loading for Pagination stories.
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
				(pageChange)="pageChange.emit($event)"
				[currentPage]="currentPage()"
				[totalPages]="totalPages()"
				[totalItems]="totalItems()"
				[pageSize]="pageSize()"
			/>
		}
	`,
})
class PaginationStoryComponent {
	private readonly translation = inject(Translation);

	readonly currentPage = input(1);
	readonly totalPages = input(1);
	readonly totalItems = input(0);
	readonly pageSize = input(10);
	readonly language = input<Language>('en');
	readonly pageChange = output<number>();

	/**
	 * Tracks when translations are loaded and ready for use.
	 * Toggling this signal forces the Pagination to re-mount with updated translations.
	 */
	readonly isReady = signal(false);

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => {
				this.isReady.set(true);
			});
		});
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
A pagination component for navigating through paged data.

## Features

- **Previous/Next Navigation**: Simple page-by-page navigation
- **Item Count Display**: Shows "Showing X to Y of Z results"
- **Page Indicator**: Shows "Page X of Y"
- **Disabled States**: Automatically disables at boundaries
- **Accessible**: Uses nav element, aria-labels, aria-live for announcements
- **Reuses Button Component**: Consistent styling via appButton directive
- **i18n Support**: All labels are localized using the Translation service

## Language Support

Use the **language** control to switch between:
- **en** (English) - Default
- **es** (Spanish)

All labels and messages will automatically update to the selected language.

## Usage

\`\`\`html
<app-pagination
  [currentPage]="page"
  [totalPages]="totalPages"
  [totalItems]="totalItems"
  [pageSize]="pageSize"
  (pageChange)="onPageChange($event)"
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
			labels: {
				en: 'English',
				es: 'Español',
			},
		},
		currentPage: {
			control: { type: 'number', min: 1 },
			description: 'Current page number (1-based)',
			table: { defaultValue: { summary: '1' } },
		},
		totalPages: {
			control: { type: 'number', min: 1 },
			description: 'Total number of pages',
			table: { defaultValue: { summary: '1' } },
		},
		totalItems: {
			control: { type: 'number', min: 0 },
			description: 'Total number of items',
			table: { defaultValue: { summary: '0' } },
		},
		pageSize: {
			control: { type: 'number', min: 1 },
			description: 'Items per page',
			table: { defaultValue: { summary: '10' } },
		},
	},
};

export default meta;

type Story = StoryObj<PaginationStoryComponent>;

/**
 * Default pagination on the first page.
 */
export const Default: Story = {
	args: {
		currentPage: 1,
		totalPages: 10,
		totalItems: 100,
		pageSize: 10,
		language: 'en',
	},
};

/**
 * Pagination on a middle page with both buttons enabled.
 */
export const MiddlePage: Story = {
	args: {
		currentPage: 5,
		totalPages: 10,
		totalItems: 100,
		pageSize: 10,
		language: 'en',
	},
};

/**
 * Pagination on the last page with partial item count.
 */
export const LastPage: Story = {
	args: {
		currentPage: 10,
		totalPages: 10,
		totalItems: 95,
		pageSize: 10,
		language: 'en',
	},
};

/**
 * Single page — both buttons disabled.
 */
export const SinglePage: Story = {
	args: {
		currentPage: 1,
		totalPages: 1,
		totalItems: 5,
		pageSize: 10,
		language: 'en',
	},
};

/**
 * Empty state with no items.
 */
export const Empty: Story = {
	args: {
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		pageSize: 10,
		language: 'en',
	},
};
