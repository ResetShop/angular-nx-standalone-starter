import { Component, computed, effect, inject, input, signal } from '@angular/core';
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
];

/**
 * Wrapper component that manages language loading for DataTable stories.
 * Destroys and re-creates the DataTable when language changes so that
 * translated defaults (emptyMessage, loadingMessage) pick up the new locale.
 */
@Component({
	selector: 'app-data-table-story',
	standalone: true,
	imports: [DataTable],
	template: `
		@if (isReady()) {
			<app-data-table
				[columns]="columns()"
				[data]="data()"
				[loading]="loading()"
				[caption]="caption()"
				[emptyMessage]="resolvedEmptyMessage()"
			/>
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

	/** Per-language custom empty messages. When empty, the translated default is used. */
	readonly emptyMessages = input<Partial<Record<Language, string>>>({});

	/**
	 * Resolves the empty message for the current language.
	 * Uses the per-language custom message if provided, otherwise the translated default.
	 * Depends on `isReady` to re-evaluate after a language change.
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
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => {
				this.isReady.set(true);
			});
		});
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

- **TanStack Table Integration**: Type-safe column definitions and sorting
- **Semantic HTML**: Proper table markup with accessibility attributes
- **Sorting**: Click column headers to sort (aria-sort, keyboard support)
- **Loading State**: Built-in loading spinner
- **Empty State**: Customizable empty message
- **Dark Mode**: Full dark mode support
- **Responsive**: Horizontal scroll on small screens
- **i18n Support**: Loading and empty messages are localized using the Translation service

## Language Support

Use the **language** control to switch between:
- **en** (English) - Default
- **es** (Spanish)

Empty and loading messages will automatically update to the selected language.

## Usage

\`\`\`typescript
import { DataTable } from '@components/data-table/data-table';
import { DataTableCellDef } from '@components/data-table/data-table-cell-def';
import { type ColumnDef } from '@tanstack/angular-table';

interface User {
  name: string;
  email: string;
  role: string;
}

@Component({
  imports: [DataTable, DataTableCellDef],
  template: \\\`
    <app-data-table
      [columns]="columns"
      [data]="users"
      [loading]="loading"
      [caption]="'Team members'"
      [emptyMessage]="'No users found.'"
      (sortChange)="onSort($event)"
    >
      <!-- Custom cell template for the 'role' column -->
      <ng-template appDataTableCellDef="role" let-value let-row="row">
        <span class="font-semibold">{{ value }}</span>
      </ng-template>
    </app-data-table>
  \\\`,
})
export class UserListComponent {
  readonly columns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: 'Name', enableSorting: true },
    { accessorKey: 'email', header: 'Email', enableSorting: true },
    { accessorKey: 'role', header: 'Role' },
  ];

  users: User[] = [];
  loading = false;

  onSort(event: { id: string; direction: 'asc' | 'desc' }) {
    // Handle sort change (e.g. fetch sorted data from API)
  }
}
\`\`\`
				`,
			},
		},
	},
	argTypes: {
		language: {
			control: 'select',
			options: ['en', 'es'],
			description: 'Language for translated messages (empty state, loading state)',
			table: {
				type: { summary: 'Language' },
				defaultValue: { summary: 'en' },
			},
			labels: {
				en: 'English',
				es: 'Español',
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
	},
};

export default meta;

type Story = StoryObj<DataTableStoryComponent>;

/**
 * Default data table with sample user data and sortable columns.
 * Toggle the **loading** switch to see the loading state.
 */
export const Default: Story = {
	args: {
		columns: sampleColumns,
		data: sampleData,
		caption: 'Users table',
		loading: false,
		language: 'en',
	},
};

/**
 * Empty table with default translated message.
 * Switch **language** to see the translated empty message.
 */
export const Empty: Story = {
	args: {
		columns: sampleColumns,
		data: [],
		language: 'en',
	},
};

/**
 * Empty table with per-language custom messages.
 * Switch **language** to see the message change.
 */
export const CustomEmptyMessage: Story = {
	args: {
		columns: sampleColumns,
		data: [],
		emptyMessages: {
			en: 'No users found. Try adjusting your filters.',
			es: 'No se encontraron usuarios. Intenta ajustar tus filtros.',
		},
		language: 'en',
	},
};

/**
 * Table in loading state with spinner.
 * Switch **language** to see the translated loading message.
 */
export const Loading: Story = {
	args: {
		columns: sampleColumns,
		data: [],
		loading: true,
		language: 'en',
	},
};

/**
 * Table with an accessible caption.
 */
export const WithCaption: Story = {
	args: {
		columns: sampleColumns,
		data: sampleData,
		caption: 'Team Members',
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
