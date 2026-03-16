import { TestBed } from '@angular/core/testing';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type { RoleData } from '@contracts/role/role.types';
import { Translation } from '@providers/i18n/translation';
import { PermissionsApiService } from '@providers/permissions/permissions';
import { RolesApiService } from '@providers/roles/roles';
import { clearAllMocks, fn, type MockFn, spyOn } from '@test-utils';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import { NEVER, of, throwError } from 'rxjs';
import RolesList from './roles-list';

function createMockRoleData(overrides: Partial<RoleData> = {}): RoleData {
	return {
		id: 1,
		name: 'Admin',
		code: 'admin',
		description: 'Administrator role',
		removable: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

function createPaginatedResponse(data: RoleData[], total?: number): PaginatedResponse<RoleData> {
	return { data, total: total ?? data.length, limit: 10, offset: 0 };
}

const TRANSLATIONS: Record<string, string> = {
	'DATA_TABLE.EMPTY': 'No data available',
	'DATA_TABLE.LOADING': 'Loading...',
	'PAGINATION.LABEL': 'Pagination',
	'PAGINATION.ROWS_PER_PAGE': 'Rows per page',
	'PAGINATION.GO_TO_PREVIOUS': 'Previous page',
	'PAGINATION.GO_TO_NEXT': 'Next page',
	'PAGINATION.GO_TO_PAGE': 'Go to page {page}',
};

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
};

describe('RolesList', () => {
	let rolesApiMock: Record<keyof RolesApiService, MockFn>;
	let permissionsApiMock: Record<keyof PermissionsApiService, MockFn>;

	beforeEach(() => {
		clearAllMocks();
		spyOn(console, 'error');

		rolesApiMock = {
			getAll: fn(),
			getAllUnpaginated: fn(),
			getByIdWithPermissions: fn(),
			create: fn(),
			update: fn(),
			delete: fn(),
			assignPermissions: fn(),
		};

		permissionsApiMock = {
			getAllUnpaginated: fn(),
		};

		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse([])));
		rolesApiMock.getAllUnpaginated.mockReturnValue(of([]));
		permissionsApiMock.getAllUnpaginated.mockReturnValue(of([]));
	});

	async function renderComponent() {
		await render(RolesList, {
			providers: [
				{ provide: RolesApiService, useValue: rolesApiMock },
				{ provide: PermissionsApiService, useValue: permissionsApiMock },
				{ provide: Translation, useValue: mockTranslation },
			],
		});
		TestBed.tick();
	}

	it('should render the page heading', async () => {
		await renderComponent();

		expect(screen.getByRole('heading', { name: /roles/i })).toBeInTheDocument();
	});

	it('should render the description text', async () => {
		await renderComponent();

		expect(screen.getByText(/manage system roles/i)).toBeInTheDocument();
	});

	it('should render a search input', async () => {
		await renderComponent();

		expect(screen.getByPlaceholderText(/search roles/i)).toBeInTheDocument();
	});

	it('should render a create role button', async () => {
		await renderComponent();

		expect(screen.getByRole('button', { name: /create role/i })).toBeInTheDocument();
	});

	it('should render data table when there is no error', async () => {
		const roles = [createMockRoleData()];
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)));

		await renderComponent();

		expect(screen.getByRole('table')).toBeInTheDocument();
	});

	it('should render column headers', async () => {
		const roles = [createMockRoleData()];
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)));

		await renderComponent();

		expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /code/i })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
	});

	it('should render role data in the table', async () => {
		const roles = [createMockRoleData({ id: 1, name: 'Admin', code: 'admin', description: 'Administrator role' })];
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)));

		await renderComponent();

		expect(screen.getByText('Admin')).toBeInTheDocument();
		expect(screen.getByText('admin')).toBeInTheDocument();
		expect(screen.getByText('Administrator role')).toBeInTheDocument();
	});

	it('should render edit button for each role', async () => {
		const roles = [createMockRoleData()];
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)));

		await renderComponent();

		expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
	});

	it('should render delete button for removable roles', async () => {
		const roles = [createMockRoleData({ removable: true })];
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)));

		await renderComponent();

		expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
	});

	it('should not render delete button for non-removable roles', async () => {
		const roles = [createMockRoleData({ removable: false })];
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)));

		await renderComponent();

		expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
	});

	it('should render alert with error message when hasReadError is true', async () => {
		rolesApiMock.getAll.mockReturnValue(throwError(() => new Error('Network error')));

		await renderComponent();

		expect(screen.getByRole('alert')).toBeInTheDocument();
		expect(screen.getByText('Error')).toBeInTheDocument();
		expect(screen.getByText('Failed to load roles')).toBeInTheDocument();
	});

	it('should not render data table when there is an error', async () => {
		rolesApiMock.getAll.mockReturnValue(throwError(() => new Error('Network error')));

		await renderComponent();

		expect(screen.queryByRole('table')).not.toBeInTheDocument();
	});

	it('should not render alert when loading', async () => {
		rolesApiMock.getAll.mockReturnValue(NEVER);

		await renderComponent();

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('should show confirm dialog when delete button is clicked', async () => {
		const roles = [createMockRoleData({ id: 1, name: 'TestRole', removable: true })];
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)));

		await renderComponent();

		fireEvent.click(screen.getByRole('button', { name: /delete/i }));

		expect(screen.getByText(/are you sure you want to delete the role 'TestRole'/i)).toBeInTheDocument();
	});

	it('should call deleteRole when delete is confirmed', async () => {
		const roles = [createMockRoleData({ id: 42, name: 'TestRole', removable: true })];
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)));
		rolesApiMock.delete.mockReturnValue(of(undefined));

		await renderComponent();

		fireEvent.click(screen.getByRole('button', { name: /delete/i }));

		const dialog = screen.getByRole('alertdialog');
		fireEvent.click(within(dialog).getByRole('button', { name: /delete/i }));

		expect(rolesApiMock.delete.calls).toHaveLength(1);
		expect(rolesApiMock.delete.calls[0][0]).toBe(42);
	});
});
