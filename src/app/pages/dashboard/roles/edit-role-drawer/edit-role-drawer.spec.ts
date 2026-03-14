import { TestBed } from '@angular/core/testing';
import { Translation } from '@providers/i18n/translation';
import { PermissionsApiService } from '@providers/permissions/permissions';
import { RolesApiService } from '@providers/roles/roles';
import { clearAllMocks, fn, type MockFn, spyOn } from '@test-utils';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { EditRoleDrawer } from './edit-role-drawer';

const TRANSLATIONS: Record<string, string> = {
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.MAX_LENGTH': 'Maximum {max} characters',
	'VALIDATION.PATTERN': 'Invalid format',
};

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
};

describe('EditRoleDrawer', () => {
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

		rolesApiMock.getAll.mockReturnValue(of({ data: [], total: 0, limit: 10, offset: 0 }));
		permissionsApiMock.getAllUnpaginated.mockReturnValue(of([]));
	});

	async function renderAndOpen(roleId = 1) {
		rolesApiMock.getByIdWithPermissions.mockReturnValue(
			of({ id: roleId, code: 'admin', name: 'Admin', description: 'Administrator role', permissions: [] }),
		);

		const { fixture } = await render(EditRoleDrawer, {
			providers: [
				{ provide: RolesApiService, useValue: rolesApiMock },
				{ provide: PermissionsApiService, useValue: permissionsApiMock },
				{ provide: Translation, useValue: mockTranslation },
			],
		});
		TestBed.tick();
		fixture.componentInstance.open(roleId);
		TestBed.tick();
		fixture.detectChanges();
	}

	it('should render drawer with edit title', async () => {
		await renderAndOpen();

		expect(screen.getByText('Edit Role')).toBeInTheDocument();
	});

	it('should render name and description form fields', async () => {
		await renderAndOpen();

		expect(screen.getByText('Name')).toBeInTheDocument();
		expect(screen.getByText('Description')).toBeInTheDocument();
	});

	it('should show code as disabled input', async () => {
		await renderAndOpen();

		expect(screen.getByText('Code cannot be changed')).toBeInTheDocument();
		expect(screen.getByDisplayValue('admin')).toBeDisabled();
	});

	it('should render save button', async () => {
		await renderAndOpen();

		expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
	});

	it('should render cancel button', async () => {
		await renderAndOpen();

		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
	});
});
