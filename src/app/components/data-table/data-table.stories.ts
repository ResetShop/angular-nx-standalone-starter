import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Pagination } from '@components/pagination/pagination';
import { type Language, Translation } from '@providers/i18n/translation';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { type ColumnDef } from '@tanstack/angular-table';
import { DataTable } from './data-table';
import { DataTableCellDef } from './data-table-cell-def';

interface User {
	name: string;
	email: string;
	role: string;
}

const sampleColumns: ColumnDef<User, unknown>[] = [
	{ accessorKey: 'name', header: 'Name', enableSorting: true },
	{ accessorKey: 'email', header: 'Email', enableSorting: true },
	{ accessorKey: 'role', header: 'Role' },
];

const sampleData: User[] = [
	{ name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
	{ name: 'Bob Smith', email: 'bob@example.com', role: 'Editor' },
	{ name: 'Carol White', email: 'carol@example.com', role: 'Viewer' },
	{ name: 'Dave Brown', email: 'dave@example.com', role: 'Editor' },
	{ name: 'Eve Davis', email: 'eve@example.com', role: 'Admin' },
	{ name: 'Frank Miller', email: 'frank@example.com', role: 'Moderator' },
	{ name: 'Grace Lee', email: 'grace@example.com', role: 'Viewer' },
	{ name: 'Henry Wilson', email: 'henry@example.com', role: 'Editor' },
	{ name: 'Ivy Chen', email: 'ivy@example.com', role: 'Moderator' },
	{ name: 'Jack Taylor', email: 'jack@example.com', role: 'Viewer' },
	{ name: 'Karen Adams', email: 'karen@example.com', role: 'Admin' },
	{ name: 'Leo Martinez', email: 'leo@example.com', role: 'Editor' },
];

/**
 * Wrapper component that manages language loading and pagination for DataTable stories.
 * Destroys and re-creates the DataTable when language changes so that
 * translated defaults (emptyMessage, loadingMessage) pick up the new locale.
 */
@Component({
	selector: 'app-data-table-story',
	standalone: true,
	imports: [DataTable, Pagination],
	template: `
		@if (isReady()) {
			<app-data-table
				[columns]="columns()"
				[data]="displayData()"
				[loading]="loading()"
				[caption]="caption()"
				[emptyMessage]="resolvedEmptyMessage()"
				[grouping]="resolvedGrouping()"
				[expandedByDefault]="expandedByDefault()"
			/>
			@if (pageSize() > 0) {
				<div class="mt-4">
					<app-pagination
						(pageChange)="onPageChange($event)"
						(pageSizeChange)="onPageSizeChange($event)"
						[currentPage]="currentPage()"
						[totalPages]="totalPages()"
						[pageSize]="pageSize()"
						[pageSizeOptions]="pageSizeOptions()"
					/>
				</div>
			}
		}
	`,
})
class DataTableStoryComponent {
	private readonly translation = inject(Translation);

	readonly columns = input<ColumnDef<User, unknown>[]>([]);
	readonly data = input<User[]>([]);
	readonly loading = input(false);
	readonly caption = input('');
	readonly language = input<Language>('en');
	readonly expandedByDefault = input(true);
	readonly showData = input(true);

	/**
	 * Grouping column selector. Maps a user-friendly label to the actual column ID.
	 * Use 'none' to disable grouping.
	 */
	readonly groupBy = input<'none' | 'role'>('none');

	/** Resolved grouping array from the `groupBy` select control */
	readonly resolvedGrouping = computed(() => {
		const groupBy = this.groupBy();
		return groupBy === 'none' ? [] : [groupBy];
	});

	/**
	 * Items per page. Set to 0 to disable pagination and show all data.
	 * When > 0, data is sliced by page and the Pagination component is shown.
	 */
	readonly pageSize = input(0);

	/** Available page size options for the pagination selector */
	readonly pageSizeOptions = input<number[]>([25, 50, 100]);

	/** Per-language custom empty messages. When empty, the translated default is used. */
	readonly emptyMessages = input<Partial<Record<Language, string>>>({});

	// --- Pagination state ---
	readonly currentPage = signal(1);
	readonly currentPageSize = signal(0);

	readonly totalItems = computed(() => this.data().length);

	readonly effectivePageSize = computed(() => {
		const inputSize = this.pageSize();
		const stateSize = this.currentPageSize();
		return stateSize > 0 ? stateSize : inputSize;
	});

	readonly totalPages = computed(() => {
		const size = this.effectivePageSize();
		if (size <= 0) return 1;
		return Math.max(1, Math.ceil(this.totalItems() / size));
	});

	/** Data sliced by current page when pagination is active, or all data otherwise. */
	readonly pagedData = computed(() => {
		const size = this.effectivePageSize();
		if (size <= 0) return this.data();
		const start = (this.currentPage() - 1) * size;
		return this.data().slice(start, start + size);
	});

	/** Data passed to the DataTable — empty when showData is false, paged otherwise. */
	readonly displayData = computed(() => (this.showData() ? this.pagedData() : []));

	/**
	 * Resolves the empty message for the current language.
	 * Uses the per-language custom message if provided, otherwise the translated default.
	 */
	readonly resolvedEmptyMessage = computed(() => {
		if (!this.isReady()) return '';
		const custom = this.emptyMessages()[this.language()];
		return custom || this.translation.instant('DATA_TABLE.EMPTY');
	});

	/**
	 * Tracks when translations are loaded and ready for use.
	 * Toggling this signal forces the DataTable to re-mount with updated translations.
	 */
	readonly isReady = signal(false);

	constructor() {
		effect(() => {
			const lang = this.language();
			const initialPageSize = this.pageSize();
			this.currentPageSize.set(initialPageSize);
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => {
				this.isReady.set(true);
			});
		});
	}

	// --- Pagination handlers ---
	onPageChange(page: number): void {
		this.currentPage.set(page);
	}

	onPageSizeChange(size: number): void {
		this.currentPageSize.set(size);
		this.currentPage.set(1);
	}
}

const meta: Meta<DataTableStoryComponent> = {
	component: DataTableStoryComponent,
	title: 'Components/DataTable',
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
A data table component powered by TanStack Table.

## Features

- **Sorting**: Click column headers to sort (aria-sort, keyboard support)
- **Row Grouping**: Group rows by a column with expand/collapse toggle
- **Pagination**: Optional page-based data slicing
- **Loading & Empty States**: Built-in spinner and customizable empty message
- **Custom Cell Templates**: Content projection via \`appDataTableCellDef\`
- **Accessibility**: aria-busy, aria-sort, aria-expanded, keyboard navigation
- **i18n**: Localized messages via the Translation service
- **Dark Mode**: Full dark mode support

## Usage

\`\`\`typescript
import { DataTable } from '@components/data-table/data-table';
import { type ColumnDef } from '@tanstack/angular-table';

@Component({
  imports: [DataTable],
  template: \\\`
    <app-data-table
      [columns]="columns"
      [data]="users"
      [grouping]="['role']"
      [expandedByDefault]="true"
      caption="Team members"
    />
  \\\`,
})
export class UserListComponent {
  readonly columns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: 'Name', enableSorting: true },
    { accessorKey: 'email', header: 'Email', enableSorting: true },
    { accessorKey: 'role', header: 'Role' },
  ];
  users: User[] = [];
}
\`\`\`
				`,
			},
		},
	},
	argTypes: {
		showData: {
			control: 'boolean',
			description: 'Show data rows (disable to see the empty state)',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
		},
		loading: {
			control: 'boolean',
			description: 'Whether the table is in a loading state',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		caption: {
			control: 'text',
			description: 'Accessible table caption (screen-reader only)',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: '' },
			},
		},
		groupBy: {
			control: 'select',
			options: ['none', 'role'],
			description: 'Column to group rows by',
			table: {
				type: { summary: "'none' | 'role'" },
				defaultValue: { summary: 'none' },
			},
		},
		expandedByDefault: {
			control: 'boolean',
			description: 'Whether groups start expanded (only applies when grouping is active)',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
		},
		pageSize: {
			control: { type: 'number', min: 0 },
			description: 'Items per page (0 to disable pagination)',
			table: {
				type: { summary: 'number' },
				defaultValue: { summary: '0' },
			},
		},
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
				es: 'Espanol',
			},
		},
	},
};

export default meta;

type Story = StoryObj<DataTableStoryComponent>;

/**
 * Interactive data table with all configurable options.
 * Use the controls panel to toggle loading, grouping, pagination, and language.
 */
export const Playground: Story = {
	args: {
		columns: sampleColumns,
		data: sampleData,
		showData: true,
		loading: false,
		caption: 'Users table',
		groupBy: 'none',
		expandedByDefault: true,
		pageSize: 0,
		language: 'en',
	},
};

/**
 * Rows grouped by the 'Role' column with expand/collapse toggles.
 * Use the `expandedByDefault` control to toggle whether groups start open or closed.
 */
export const GroupedByRole: Story = {
	args: {
		columns: sampleColumns,
		data: sampleData,
		showData: true,
		loading: false,
		caption: 'Users table',
		groupBy: 'role',
		expandedByDefault: true,
		pageSize: 0,
		language: 'en',
	},
};

/**
 * Wrapper component demonstrating custom cell templates via content projection.
 * Renders the 'role' column with a colored badge and 'email' as a mailto link.
 */
@Component({
	selector: 'app-data-table-custom-cells-story',
	standalone: true,
	imports: [DataTable, DataTableCellDef],
	template: `
		<app-data-table [columns]="columns()" [data]="data()">
			<ng-template appDataTableCellDef="role" let-value>
				<span
					class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
				>
					{{ value }}
				</span>
			</ng-template>
			<ng-template appDataTableCellDef="email" let-value>
				<a class="text-blue-600 underline dark:text-blue-400">{{ value }}</a>
			</ng-template>
		</app-data-table>
	`,
})
class DataTableCustomCellsStoryComponent {
	readonly columns = input<ColumnDef<User, unknown>[]>([]);
	readonly data = input<User[]>([]);
}

/**
 * Table with custom cell templates for 'role' (badge) and 'email' (link).
 * Demonstrates content projection via `appDataTableCellDef`.
 */
export const CustomCellTemplates: StoryObj<DataTableCustomCellsStoryComponent> = {
	render: (args) => ({
		props: args,
		component: DataTableCustomCellsStoryComponent,
	}),
	args: {
		columns: sampleColumns,
		data: sampleData,
	},
};
