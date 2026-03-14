import { TestBed } from '@angular/core/testing';
import { Translation } from '@providers/i18n/translation';
import { PermissionsApiService } from '@providers/permissions/permissions';
import { RolesApiService } from '@providers/roles/roles';
import { clearAllMocks, fn, type MockFn, spyOn } from '@test-utils';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { RoleFormDrawer } from './role-form-drawer';

const TRANSLATIONS: Record<string, string> = {
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.MAX_LENGTH': 'Maximum {max} characters',
	'VALIDATION.PATTERN': 'Invalid format',
};

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
};

describe('RoleFormDrawer', () => {
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

	async function renderComponent() {
		const view = await render(RoleFormDrawer, {
			providers: [
				{ provide: RolesApiService, useValue: rolesApiMock },
				{ provide: PermissionsApiService, useValue: permissionsApiMock },
				{ provide: Translation, useValue: mockTranslation },
			],
		});
		TestBed.tick();
		return view;
	}

	it('should render drawer with create title when opened for create', async () => {
		const { fixture } = await renderComponent();

		fixture.componentInstance.openForCreate();
		fixture.detectChanges();

		expect(screen.getByText('Create Role')).toBeInTheDocument();
	});

	it('should render name and description form fields in create mode', async () => {
		const { fixture } = await renderComponent();

		fixture.componentInstance.openForCreate();
		fixture.detectChanges();

		expect(screen.getByText('Name')).toBeInTheDocument();
		expect(screen.getByText('Code')).toBeInTheDocument();
		expect(screen.getByText('Description')).toBeInTheDocument();
	});

	it('should render create button in create mode', async () => {
		const { fixture } = await renderComponent();

		fixture.componentInstance.openForCreate();
		fixture.detectChanges();

		expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
	});

	it('should render save button in edit mode', async () => {
		const { fixture } = await renderComponent();

		rolesApiMock.getByIdWithPermissions.mockReturnValue(
			of({ id: 1, code: 'admin', name: 'Admin', description: null, permissions: [] }),
		);

		fixture.componentInstance.openForEdit(1);
		TestBed.tick();
		fixture.detectChanges();

		expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
	});

	it('should render cancel button', async () => {
		const { fixture } = await renderComponent();

		fixture.componentInstance.openForCreate();
		fixture.detectChanges();

		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
	});

	it('should show edit title when opened for edit', async () => {
		const { fixture } = await renderComponent();

		rolesApiMock.getByIdWithPermissions.mockReturnValue(
			of({ id: 1, code: 'admin', name: 'Admin', description: null, permissions: [] }),
		);

		fixture.componentInstance.openForEdit(1);
		TestBed.tick();
		fixture.detectChanges();

		expect(screen.getByText('Edit Role')).toBeInTheDocument();
	});

	it('should show code as read-only in edit mode', async () => {
		const { fixture } = await renderComponent();

		rolesApiMock.getByIdWithPermissions.mockReturnValue(
			of({ id: 1, code: 'admin', name: 'Admin', description: null, permissions: [] }),
		);

		fixture.componentInstance.openForEdit(1);
		TestBed.tick();
		fixture.detectChanges();

		expect(screen.getByText('Code cannot be changed')).toBeInTheDocument();
	});
});
