import { TestBed } from '@angular/core/testing';
import { Translation } from '@providers/i18n/translation';
import { PermissionsApiService } from '@providers/permissions/permissions';
import { RolesApiService } from '@providers/roles/roles';
import { clearAllMocks, fn, type MockFn, spyOn } from '@test-utils';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { CreateRoleDrawer } from './create-role-drawer';

const TRANSLATIONS: Record<string, string> = {
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.MAX_LENGTH': 'Maximum {max} characters',
	'VALIDATION.PATTERN': 'Invalid format',
};

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
};

describe('CreateRoleDrawer', () => {
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

	async function renderAndOpen() {
		const { fixture } = await render(CreateRoleDrawer, {
			providers: [
				{ provide: RolesApiService, useValue: rolesApiMock },
				{ provide: PermissionsApiService, useValue: permissionsApiMock },
				{ provide: Translation, useValue: mockTranslation },
			],
		});
		TestBed.tick();
		fixture.componentInstance.open();
		fixture.detectChanges();
	}

	it('should render drawer with create title', async () => {
		await renderAndOpen();

		expect(screen.getByText('Create Role')).toBeInTheDocument();
	});

	it('should render name, code, and description form fields', async () => {
		await renderAndOpen();

		expect(screen.getByText('Name')).toBeInTheDocument();
		expect(screen.getByText('Code')).toBeInTheDocument();
		expect(screen.getByText('Description')).toBeInTheDocument();
	});

	it('should render code hint for format guidance', async () => {
		await renderAndOpen();

		expect(screen.getByText(/lowercase alphanumeric/i)).toBeInTheDocument();
	});

	it('should render create button', async () => {
		await renderAndOpen();

		expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
	});

	it('should render cancel button', async () => {
		await renderAndOpen();

		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
	});
});
