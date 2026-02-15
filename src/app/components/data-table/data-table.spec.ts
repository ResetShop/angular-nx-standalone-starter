import { Translation } from '@providers/i18n/translation';
import { type ColumnDef } from '@tanstack/angular-table';
import { fn } from '@test-utils';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { DataTable } from './data-table';
import { DataTableCellDef } from './data-table-cell-def';

interface TestData {
	id: number;
	name: string;
	email: string;
}

interface GroupableData {
	name: string;
	role: string;
	email: string;
}

const testColumns: ColumnDef<TestData, unknown>[] = [
	{ accessorKey: 'id', header: 'ID', enableSorting: false },
	{ accessorKey: 'name', header: 'Name', enableSorting: false },
	{ accessorKey: 'email', header: 'Email', enableSorting: false },
];

const testData: TestData[] = [
	{ id: 1, name: 'John Doe', email: 'john@example.com' },
	{ id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

const TRANSLATIONS: Record<string, string> = {
	'DATA_TABLE.EMPTY': 'No data available',
	'DATA_TABLE.LOADING': 'Loading...',
};

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
};

describe('DataTable', () => {
	it('should render table with headers', async () => {
		await render(DataTable<TestData>, {
			inputs: { columns: testColumns, data: testData },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByRole('columnheader', { name: /id/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
	});

	it('should render data rows', async () => {
		await render(DataTable<TestData>, {
			inputs: { columns: testColumns, data: testData },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByText('John Doe')).toBeInTheDocument();
		expect(screen.getByText('jane@example.com')).toBeInTheDocument();
	});

	it('should show empty message when no data', async () => {
		await render(DataTable<TestData>, {
			inputs: { columns: testColumns, data: [] },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByText('No data available')).toBeInTheDocument();
	});

	it('should show custom empty message', async () => {
		await render(DataTable<TestData>, {
			inputs: { columns: testColumns, data: [], emptyMessage: 'Nothing here' },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByText('Nothing here')).toBeInTheDocument();
	});

	it('should show loading state', async () => {
		await render(DataTable<TestData>, {
			inputs: { columns: testColumns, data: [], loading: true },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('should set aria-busy when loading', async () => {
		await render(DataTable<TestData>, {
			inputs: { columns: testColumns, data: [], loading: true },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
	});

	it('should render caption when provided', async () => {
		await render(DataTable<TestData>, {
			inputs: { columns: testColumns, data: testData, caption: 'Users list' },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByRole('table', { name: /users list/i })).toBeInTheDocument();
	});

	it('should toggle sort when clicking sortable header', async () => {
		const user = userEvent.setup();
		const sortableColumns: ColumnDef<TestData, unknown>[] = [
			{ accessorKey: 'name', header: 'Name', enableSorting: true },
			{ accessorKey: 'email', header: 'Email', enableSorting: false },
		];

		await render(DataTable<TestData>, {
			inputs: { columns: sortableColumns, data: testData },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const nameHeader = screen.getByRole('columnheader', { name: /name/i });
		await user.click(nameHeader);

		expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
	});

	it('should cycle sort direction: asc → desc → none', async () => {
		const user = userEvent.setup();
		const sortableColumns: ColumnDef<TestData, unknown>[] = [
			{ accessorKey: 'name', header: 'Name', enableSorting: true },
			{ accessorKey: 'email', header: 'Email', enableSorting: false },
		];

		await render(DataTable<TestData>, {
			inputs: { columns: sortableColumns, data: testData },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const nameHeader = screen.getByRole('columnheader', { name: /name/i });

		await user.click(nameHeader);
		expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

		await user.click(nameHeader);
		expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

		await user.click(nameHeader);
		expect(nameHeader).not.toHaveAttribute('aria-sort');
	});

	it('should emit sortChange when clicking sortable header', async () => {
		const user = userEvent.setup();
		const sortChangeSpy = fn<[{ id: string; direction: string }], void>();
		const sortableColumns: ColumnDef<TestData, unknown>[] = [
			{ accessorKey: 'name', header: 'Name', enableSorting: true },
			{ accessorKey: 'email', header: 'Email', enableSorting: false },
		];

		await render(DataTable<TestData>, {
			inputs: { columns: sortableColumns, data: testData },
			on: { sortChange: sortChangeSpy },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const nameHeader = screen.getByRole('columnheader', { name: /name/i });
		await user.click(nameHeader);

		expect(sortChangeSpy.calls).toContainEqual([{ id: 'name', direction: 'asc' }]);
	});

	it('should toggle sort via Enter key on sortable header', async () => {
		const user = userEvent.setup();
		const sortableColumns: ColumnDef<TestData, unknown>[] = [
			{ accessorKey: 'name', header: 'Name', enableSorting: true },
			{ accessorKey: 'email', header: 'Email', enableSorting: false },
		];

		await render(DataTable<TestData>, {
			inputs: { columns: sortableColumns, data: testData },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const nameHeader = screen.getByRole('columnheader', { name: /name/i });
		nameHeader.focus();
		await user.keyboard('{Enter}');

		expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
	});

	it('should toggle sort via Space key on sortable header', async () => {
		const user = userEvent.setup();
		const sortableColumns: ColumnDef<TestData, unknown>[] = [
			{ accessorKey: 'name', header: 'Name', enableSorting: true },
			{ accessorKey: 'email', header: 'Email', enableSorting: false },
		];

		await render(DataTable<TestData>, {
			inputs: { columns: sortableColumns, data: testData },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		const nameHeader = screen.getByRole('columnheader', { name: /name/i });
		nameHeader.focus();
		await user.keyboard(' ');

		expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
	});

	it('should render custom cell template when provided', async () => {
		await render(
			`<app-data-table [columns]="columns" [data]="data">
				<ng-template appDataTableCellDef="name" let-value>Custom: {{ value }}</ng-template>
			</app-data-table>`,
			{
				imports: [DataTable, DataTableCellDef],
				componentProperties: {
					columns: testColumns,
					data: testData,
				},
				providers: [{ provide: Translation, useValue: mockTranslation }],
			},
		);

		expect(screen.getByText('Custom: John Doe')).toBeInTheDocument();
		expect(screen.getByText('Custom: Jane Smith')).toBeInTheDocument();
	});

	it('should render multiple custom cell templates', async () => {
		await render(
			`<app-data-table [columns]="columns" [data]="data">
				<ng-template appDataTableCellDef="name" let-value>Name: {{ value }}</ng-template>
				<ng-template appDataTableCellDef="email" let-value>Email: {{ value }}</ng-template>
			</app-data-table>`,
			{
				imports: [DataTable, DataTableCellDef],
				componentProperties: {
					columns: testColumns,
					data: testData,
				},
				providers: [{ provide: Translation, useValue: mockTranslation }],
			},
		);

		expect(screen.getByText('Name: John Doe')).toBeInTheDocument();
		expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();
	});

	it('should provide row data in custom cell template context', async () => {
		await render(
			`<app-data-table [columns]="columns" [data]="data">
				<ng-template appDataTableCellDef="name" let-row="row">{{ row.name }} ({{ row.email }})</ng-template>
			</app-data-table>`,
			{
				imports: [DataTable, DataTableCellDef],
				componentProperties: {
					columns: testColumns,
					data: testData,
				},
				providers: [{ provide: Translation, useValue: mockTranslation }],
			},
		);

		expect(screen.getByText('John Doe (john@example.com)')).toBeInTheDocument();
		expect(screen.getByText('Jane Smith (jane@example.com)')).toBeInTheDocument();
	});

	it('should handle empty columns array', async () => {
		await render(DataTable<TestData>, {
			inputs: { columns: [], data: [] },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByRole('table')).toBeInTheDocument();
		expect(screen.queryAllByRole('columnheader')).toHaveLength(0);
	});

	it('should render function headers', async () => {
		const fnColumns: ColumnDef<TestData, unknown>[] = [
			{ accessorKey: 'name', header: () => 'Full Name', enableSorting: false },
		];

		await render(DataTable<TestData>, {
			inputs: { columns: fnColumns, data: testData },
			providers: [{ provide: Translation, useValue: mockTranslation }],
		});

		expect(screen.getByRole('columnheader', { name: /full name/i })).toBeInTheDocument();
	});

	describe('Grouping', () => {
		const groupableColumns: ColumnDef<GroupableData, unknown>[] = [
			{ accessorKey: 'name', header: 'Name', enableSorting: false },
			{ accessorKey: 'role', header: 'Role', enableSorting: false },
			{ accessorKey: 'email', header: 'Email', enableSorting: false },
		];

		const groupableData: GroupableData[] = [
			{ name: 'Alice', role: 'Admin', email: 'alice@example.com' },
			{ name: 'Bob', role: 'Editor', email: 'bob@example.com' },
			{ name: 'Carol', role: 'Admin', email: 'carol@example.com' },
			{ name: 'Dave', role: 'Editor', email: 'dave@example.com' },
			{ name: 'Eve', role: 'Viewer', email: 'eve@example.com' },
		];

		it('should render group headers when grouping is set', async () => {
			await render(DataTable<GroupableData>, {
				inputs: { columns: groupableColumns, data: groupableData, grouping: ['role'] },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			});

			expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /editor/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /viewer/i })).toBeInTheDocument();
		});

		it('should show row count per group', async () => {
			await render(DataTable<GroupableData>, {
				inputs: { columns: groupableColumns, data: groupableData, grouping: ['role'] },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			});

			const adminButton = screen.getByRole('button', { name: /admin/i });
			expect(within(adminButton).getByText('(2)')).toBeInTheDocument();

			const editorButton = screen.getByRole('button', { name: /editor/i });
			expect(within(editorButton).getByText('(2)')).toBeInTheDocument();

			const viewerButton = screen.getByRole('button', { name: /viewer/i });
			expect(within(viewerButton).getByText('(1)')).toBeInTheDocument();
		});

		it('should show data rows expanded by default', async () => {
			await render(DataTable<GroupableData>, {
				inputs: { columns: groupableColumns, data: groupableData, grouping: ['role'] },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			});

			expect(screen.getByText('Alice')).toBeInTheDocument();
			expect(screen.getByText('Bob')).toBeInTheDocument();
			expect(screen.getByText('Eve')).toBeInTheDocument();
		});

		it('should collapse group rows when clicking the group header', async () => {
			const user = userEvent.setup();

			await render(DataTable<GroupableData>, {
				inputs: { columns: groupableColumns, data: groupableData, grouping: ['role'] },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			});

			expect(screen.getByText('Alice')).toBeInTheDocument();

			await user.click(screen.getByRole('button', { name: /admin/i }));

			expect(screen.queryByText('Alice')).not.toBeInTheDocument();
			expect(screen.queryByText('Carol')).not.toBeInTheDocument();
			// Other groups remain visible
			expect(screen.getByText('Bob')).toBeInTheDocument();
		});

		it('should re-expand collapsed group when clicking the header again', async () => {
			const user = userEvent.setup();

			await render(DataTable<GroupableData>, {
				inputs: { columns: groupableColumns, data: groupableData, grouping: ['role'] },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			});

			const adminHeader = screen.getByRole('button', { name: /admin/i });

			await user.click(adminHeader);
			expect(screen.queryByText('Alice')).not.toBeInTheDocument();

			await user.click(adminHeader);
			expect(screen.getByText('Alice')).toBeInTheDocument();
		});

		it('should render data rows without grouping when grouping is empty', async () => {
			await render(DataTable<GroupableData>, {
				inputs: { columns: groupableColumns, data: groupableData, grouping: [] },
				providers: [{ provide: Translation, useValue: mockTranslation }],
			});

			expect(screen.queryAllByRole('button')).toHaveLength(0);
			expect(screen.getByText('Alice')).toBeInTheDocument();
			expect(screen.getByText('Eve')).toBeInTheDocument();
		});
	});
});
