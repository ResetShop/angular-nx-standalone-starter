import { TestBed } from '@angular/core/testing'
import { createPaginatedResponse } from '@mocks/pagination.mock'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { Translation } from '@providers/i18n/translation'
import { mockTranslation } from '@providers/i18n/translation.mock'
import { PermissionsApi } from '@providers/permissions/permissions.interface'
import { RolesApi } from '@providers/roles/roles.interface'
import { createMockRoleData } from '@providers/roles/roles.mock'
import { AuthStore } from '@store/auth/auth.store'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	type MockFn,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@test-utils'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import RolesList from './roles-list'

describe('RolesList', () => {
	let rolesApiMock: Record<keyof RolesApi, MockFn>
	let permissionsApiMock: Record<keyof PermissionsApi, MockFn>

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		spyOn(console, 'error')

		rolesApiMock = {
			getAll: fn(),
			getAllUnpaginated: fn(),
			getByIdWithPermissions: fn(),
			create: fn(),
			update: fn(),
			delete: fn(),
			assignPermissions: fn(),
		}

		permissionsApiMock = {
			getAllUnpaginated: fn(),
		}

		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse([])))
		rolesApiMock.getAllUnpaginated.mockReturnValue(of([]))
		permissionsApiMock.getAllUnpaginated.mockReturnValue(of([]))
	})

	afterEach(() => {
		useRealTimers()
	})

	function setUserWithAllPermissions(): void {
		TestBed.inject(AuthStore).updateCurrentUser(createMockUser({ hasPermissionByIdentifier: () => true }))
	}

	async function renderComponent() {
		const view = await render(RolesList, {
			providers: [
				{ provide: RolesApi, useValue: rolesApiMock },
				{ provide: PermissionsApi, useValue: permissionsApiMock },
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
				{ provide: Translation, useValue: mockTranslation },
			],
		})
		setUserWithAllPermissions()
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	it('should show action skeletons while loading', async () => {
		rolesApiMock.getAll.mockReturnValue(NEVER)

		await render(RolesList, {
			providers: [
				{ provide: RolesApi, useValue: rolesApiMock },
				{ provide: PermissionsApi, useValue: permissionsApiMock },
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
				{ provide: Translation, useValue: mockTranslation },
			],
		})
		setUserWithAllPermissions()
		TestBed.tick()

		expect(screen.getByTestId('roles-actions-skeleton')).toBeInTheDocument()
		expect(screen.queryByPlaceholderText(/search roles/i)).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /create role/i })).not.toBeInTheDocument()
	})

	it('should show real actions after loading completes', async () => {
		await renderComponent()

		expect(screen.queryByTestId('roles-actions-skeleton')).not.toBeInTheDocument()
		expect(screen.getByPlaceholderText(/search roles/i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /create role/i })).toBeInTheDocument()
	})

	it('should render the page heading', async () => {
		await renderComponent()

		expect(screen.getByRole('heading', { name: /roles/i })).toBeInTheDocument()
	})

	it('should render the description text', async () => {
		await renderComponent()

		expect(screen.getByText(/manage system roles/i)).toBeInTheDocument()
	})

	it('should render a search input', async () => {
		await renderComponent()

		expect(screen.getByPlaceholderText(/search roles/i)).toBeInTheDocument()
	})

	it('should render a create role button', async () => {
		await renderComponent()

		expect(screen.getByRole('button', { name: /create role/i })).toBeInTheDocument()
	})

	it('should render data table when there is no error', async () => {
		const roles = [createMockRoleData()]
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)))

		await renderComponent()

		expect(screen.getByRole('table')).toBeInTheDocument()
	})

	it('should render column headers', async () => {
		const roles = [createMockRoleData()]
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)))

		await renderComponent()

		expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument()
		expect(screen.getByRole('columnheader', { name: /code/i })).toBeInTheDocument()
		expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument()
	})

	it('should render role data in the table', async () => {
		const roles = [createMockRoleData({ id: 1, name: 'Admin', code: 'admin', description: 'Administrator role' })]
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)))

		await renderComponent()

		expect(screen.getByText('Admin')).toBeInTheDocument()
		expect(screen.getByText('admin')).toBeInTheDocument()
		expect(screen.getByText('Administrator role')).toBeInTheDocument()
	})

	it('should render edit button for each role', async () => {
		const roles = [createMockRoleData()]
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)))

		await renderComponent()

		expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
	})

	it('should render delete button for removable roles', async () => {
		const roles = [createMockRoleData({ removable: true })]
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)))

		await renderComponent()

		expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
	})

	it('should not render delete button for non-removable roles', async () => {
		const roles = [createMockRoleData({ removable: false })]
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)))

		await renderComponent()

		expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
	})

	it('should render alert with error message when hasReadError is true', async () => {
		rolesApiMock.getAll.mockReturnValue(throwError(() => new Error('Network error')))

		await renderComponent()

		expect(screen.getByRole('alert')).toBeInTheDocument()
		expect(screen.getByText('Failed to load roles')).toBeInTheDocument()
	})

	it('should not render data table when there is an error', async () => {
		rolesApiMock.getAll.mockReturnValue(throwError(() => new Error('Network error')))

		await renderComponent()

		expect(screen.queryByRole('table')).not.toBeInTheDocument()
	})

	it('should not render alert when loading', async () => {
		rolesApiMock.getAll.mockReturnValue(NEVER)

		await renderComponent()

		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('should show confirm dialog when delete button is clicked', async () => {
		const roles = [createMockRoleData({ id: 1, name: 'TestRole', removable: true })]
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)))

		await renderComponent()

		fireEvent.click(screen.getByRole('button', { name: /delete/i }))

		expect(screen.getByText(/are you sure you want to delete the role 'TestRole'/i)).toBeInTheDocument()
	})

	it('should call deleteRole when delete is confirmed', async () => {
		const roles = [createMockRoleData({ id: 42, name: 'TestRole', removable: true })]
		rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)))
		rolesApiMock.delete.mockReturnValue(of(undefined))

		await renderComponent()

		fireEvent.click(screen.getByRole('button', { name: /delete/i }))

		const dialog = screen.getByRole('alertdialog')
		fireEvent.click(within(dialog).getByRole('button', { name: /delete/i }))

		expect(rolesApiMock.delete.calls).toHaveLength(1)
		expect(rolesApiMock.delete.calls[0][0]).toBe(42)
	})

	describe('permission-conditional rendering', () => {
		async function renderWithPermissions(allowedPermissions: string[]) {
			const roles = [createMockRoleData({ removable: true })]
			rolesApiMock.getAll.mockReturnValue(of(createPaginatedResponse(roles)))

			const view = await render(RolesList, {
				providers: [
					{ provide: RolesApi, useValue: rolesApiMock },
					{ provide: PermissionsApi, useValue: permissionsApiMock },
					{ provide: AuthApi, useValue: new InMemoryAuthApi() },
					{ provide: Translation, useValue: mockTranslation },
				],
			})

			TestBed.inject(AuthStore).updateCurrentUser(
				createMockUser({
					hasPermissionByIdentifier: (id: string) => allowedPermissions.includes(id),
				}),
			)
			TestBed.tick()
			await advanceTimersByTimeAsync(1000)
			view.fixture.detectChanges()
			return view
		}

		it('should hide create button when user lacks roles:create', async () => {
			await renderWithPermissions(['admin:roles:read', 'admin:roles:update', 'admin:roles:delete'])

			expect(screen.queryByRole('button', { name: /create role/i })).not.toBeInTheDocument()
		})

		it('should hide edit button when user lacks roles:update', async () => {
			await renderWithPermissions(['admin:roles:read', 'admin:roles:delete'])

			expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
		})

		it('should hide delete button when user lacks roles:delete', async () => {
			await renderWithPermissions(['admin:roles:read', 'admin:roles:update'])

			expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
		})

		it('should not render actions column when user lacks both update and delete', async () => {
			await renderWithPermissions(['admin:roles:read', 'admin:roles:create'])

			expect(screen.queryByRole('columnheader', { name: /actions/i })).not.toBeInTheDocument()
		})
	})
})
