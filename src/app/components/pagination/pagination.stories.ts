import { Button } from '@components/button/button';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Pagination } from './pagination';

const meta: Meta<Pagination> = {
	component: Pagination,
	title: 'Components/Pagination',
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [Pagination, Button],
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

type Story = StoryObj<Pagination>;

/**
 * Default pagination on the first page.
 */
export const Default: Story = {
	args: {
		currentPage: 1,
		totalPages: 10,
		totalItems: 100,
		pageSize: 10,
	},
	render: (args) => ({
		props: args,
		template: '<app-pagination [currentPage]="currentPage" [totalPages]="totalPages" [totalItems]="totalItems" [pageSize]="pageSize" />',
	}),
};

/**
 * Pagination on a middle page with both buttons enabled.
 */
export const MiddlePage: Story = {
	render: () => ({
		props: { currentPage: 5, totalPages: 10, totalItems: 100, pageSize: 10 },
		template: '<app-pagination [currentPage]="currentPage" [totalPages]="totalPages" [totalItems]="totalItems" [pageSize]="pageSize" />',
	}),
};

/**
 * Pagination on the last page with partial item count.
 */
export const LastPage: Story = {
	render: () => ({
		props: { currentPage: 10, totalPages: 10, totalItems: 95, pageSize: 10 },
		template: '<app-pagination [currentPage]="currentPage" [totalPages]="totalPages" [totalItems]="totalItems" [pageSize]="pageSize" />',
	}),
};

/**
 * Single page — both buttons disabled.
 */
export const SinglePage: Story = {
	render: () => ({
		props: { currentPage: 1, totalPages: 1, totalItems: 5, pageSize: 10 },
		template: '<app-pagination [currentPage]="currentPage" [totalPages]="totalPages" [totalItems]="totalItems" [pageSize]="pageSize" />',
	}),
};

/**
 * Empty state with no items.
 */
export const Empty: Story = {
	render: () => ({
		props: { currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 10 },
		template: '<app-pagination [currentPage]="currentPage" [totalPages]="totalPages" [totalItems]="totalItems" [pageSize]="pageSize" />',
	}),
};
