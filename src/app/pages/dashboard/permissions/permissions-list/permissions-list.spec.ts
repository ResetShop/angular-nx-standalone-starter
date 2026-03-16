import { TestBed } from '@angular/core/testing'
import type { PermissionData } from '@contracts/role/role.types'
import { Translation } from '@providers/i18n/translation'
import { PermissionsApiService } from '@providers/permissions/permissions'
import { clearAllMocks, fn, type MockFn, spyOn } from '@test-utils'
import { render, screen } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import PermissionsList from './permissions-list'

function createMockPermissionData(overrides: Partial<PermissionData> = {}): PermissionData {
	return {
		id: 1,
		name: 'Read Users',
		description: 'Can read user records',
		resource: 'users',
		action: 'read',
		...overrides,
	}
}

const TRANSLATIONS: Record<string, string> = {
	'DATA_TABLE.EMPTY': 'No data available',
	'DATA_TABLE.LOADING': 'Loading...',
}

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
}

describe('PermissionsList', () => {
	let permissionsApiMock: Record<keyof PermissionsApiService, MockFn>

	beforeEach(() => {
		clearAllMocks()
		spyOn(console, 'error')

		permissionsApiMock = {
			getAllUnpaginated: fn(),
		}

		permissionsApiMock.getAllUnpaginated.mockReturnValue(of([]))
	})

	async function renderComponent() {
		await render(PermissionsList, {
			providers: [
				{ provide: PermissionsApiService, useValue: permissionsApiMock },
				{ provide: Translation, useValue: mockTranslation },
			],
		})
		TestBed.tick()
	}

	it('should render the page heading', async () => {
		await renderComponent()

		expect(screen.getByRole('heading', { name: /permissions/i })).toBeInTheDocument()
	})

	it('should render the description text', async () => {
		await renderComponent()

		expect(screen.getByText(/module:resource:action/)).toBeInTheDocument()
	})

	it('should render data table when there is no error', async () => {
		const permissions = [
			createMockPermissionData({ id: 1, resource: 'users', action: 'read' }),
			createMockPermissionData({ id: 2, resource: 'users', action: 'write', name: 'Write Users' }),
		]
		permissionsApiMock.getAllUnpaginated.mockReturnValue(of(permissions))

		await renderComponent()

		expect(screen.getByRole('table')).toBeInTheDocument()
		expect(screen.getByText('Permissions grouped by resource')).toBeInTheDocument()
	})

	it('should not render alert when loading', async () => {
		permissionsApiMock.getAllUnpaginated.mockReturnValue(NEVER)

		await renderComponent()

		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('should render alert with error message when hasReadError is true', async () => {
		permissionsApiMock.getAllUnpaginated.mockReturnValue(throwError(() => new Error('Network error')))

		await renderComponent()

		expect(screen.getByRole('alert')).toBeInTheDocument()
		expect(screen.getByText('Error')).toBeInTheDocument()
		expect(screen.getByText('Failed to load permissions')).toBeInTheDocument()
	})

	it('should not render data table when there is an error', async () => {
		permissionsApiMock.getAllUnpaginated.mockReturnValue(throwError(() => new Error('Network error')))

		await renderComponent()

		expect(screen.queryByRole('table')).not.toBeInTheDocument()
	})

	it('should render column headers', async () => {
		const permissions = [createMockPermissionData()]
		permissionsApiMock.getAllUnpaginated.mockReturnValue(of(permissions))

		await renderComponent()

		expect(screen.getByRole('columnheader', { name: /resource/i })).toBeInTheDocument()
		expect(screen.getByRole('columnheader', { name: /action/i })).toBeInTheDocument()
		expect(screen.getByRole('columnheader', { name: /identifier/i })).toBeInTheDocument()
		expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument()
	})

	it('should display permission identifier in the table', async () => {
		const permissions = [
			createMockPermissionData({ id: 1, resource: 'users', action: 'read', description: 'Can read user records' }),
		]
		permissionsApiMock.getAllUnpaginated.mockReturnValue(of(permissions))

		await renderComponent()

		expect(screen.getByText('users:read')).toBeInTheDocument()
		expect(screen.getByText('Can read user records')).toBeInTheDocument()
	})
})
