import { TestBed } from '@angular/core/testing'
import { createPaginatedResponse } from '@mocks/pagination.mock'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { Translation } from '@providers/i18n/translation'
import { mockTranslation } from '@providers/i18n/translation.mock'
import { RolesApi } from '@providers/roles/roles.interface'
import { UsersApi } from '@providers/users/users.interface'
import { createMockManagedUser } from '@providers/users/users.mock'
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
import UsersList from './users-list'

describe('UsersList', () => {
	let usersApiMock: Record<keyof UsersApi, MockFn>
	let rolesApiMock: Record<keyof RolesApi, MockFn>

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		spyOn(console, 'error')

		usersApiMock = {
			getAll: fn(),
			getById: fn(),
			create: fn(),
			update: fn(),
			delete: fn(),
			updateStatus: fn(),
		}

		rolesApiMock = {
			getAll: fn(),
			getAllUnpaginated: fn(),
			getByIdWithPermissions: fn(),
			create: fn(),
			update: fn(),
			delete: fn(),
			assignPermissions: fn(),
		}

		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse([])))
		rolesApiMock.getAll.mockReturnValue(of({ data: [], total: 0, limit: 10, offset: 0 }))
		rolesApiMock.getAllUnpaginated.mockReturnValue(of([]))
	})

	afterEach(() => {
		useRealTimers()
	})

	function setUserWithAllPermissions(): void {
		TestBed.inject(AuthStore).updateCurrentUser(createMockUser({ hasPermissionByIdentifier: () => true }))
	}

	async function renderComponent() {
		const view = await render(UsersList, {
			providers: [
				{ provide: UsersApi, useValue: usersApiMock },
				{ provide: RolesApi, useValue: rolesApiMock },
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
		usersApiMock.getAll.mockReturnValue(NEVER)

		await render(UsersList, {
			providers: [
				{ provide: UsersApi, useValue: usersApiMock },
				{ provide: RolesApi, useValue: rolesApiMock },
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
				{ provide: Translation, useValue: mockTranslation },
			],
		})
		setUserWithAllPermissions()
		TestBed.tick()

		expect(screen.getByTestId('users-actions-skeleton')).toBeInTheDocument()
		expect(screen.queryByPlaceholderText(/search users/i)).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /create user/i })).not.toBeInTheDocument()
	})

	it('should show real actions after loading completes', async () => {
		await renderComponent()

		expect(screen.queryByTestId('users-actions-skeleton')).not.toBeInTheDocument()
		expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument()
	})

	it('should render the page heading', async () => {
		await renderComponent()

		expect(screen.getByRole('heading', { name: /users/i })).toBeInTheDocument()
	})

	it('should render the description text', async () => {
		await renderComponent()

		expect(screen.getByText(/manage system users/i)).toBeInTheDocument()
	})

	it('should render a search input', async () => {
		await renderComponent()

		expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument()
	})

	it('should render a create user button', async () => {
		await renderComponent()

		expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument()
	})

	it('should render data table when there is no error', async () => {
		const users = [createMockManagedUser()]
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))

		await renderComponent()

		expect(screen.getByRole('table')).toBeInTheDocument()
	})

	it('should render column headers', async () => {
		const users = [createMockManagedUser()]
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))

		await renderComponent()

		expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument()
		expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument()
		expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
		expect(screen.getByRole('columnheader', { name: /roles/i })).toBeInTheDocument()
	})

	it('should render user data in the table', async () => {
		const users = [createMockManagedUser({ id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' })]
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))

		await renderComponent()

		expect(screen.getByText('John Doe')).toBeInTheDocument()
		expect(screen.getByText('john@example.com')).toBeInTheDocument()
	})

	it('should render user roles as comma-separated list', async () => {
		const users = [
			createMockManagedUser({
				roles: [
					{
						id: 1,
						name: 'Admin',
						code: 'admin',
						description: null,
						removable: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					{
						id: 2,
						name: 'Editor',
						code: 'editor',
						description: null,
						removable: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
			}),
		]
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))

		await renderComponent()

		expect(screen.getByText('Admin, Editor')).toBeInTheDocument()
	})

	it('should render em dash when user has no roles', async () => {
		const users = [createMockManagedUser({ roles: [] })]
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))

		await renderComponent()

		expect(screen.getByText('\u2014')).toBeInTheDocument()
	})

	it('should render edit button for each user', async () => {
		const users = [createMockManagedUser()]
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))

		await renderComponent()

		expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
	})

	it('should render delete button for each user', async () => {
		const users = [createMockManagedUser()]
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))

		await renderComponent()

		expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
	})

	it('should render alert with error message when hasReadError is true', async () => {
		usersApiMock.getAll.mockReturnValue(throwError(() => new Error('Network error')))

		await renderComponent()

		expect(screen.getByRole('alert')).toBeInTheDocument()
		expect(screen.getByText('Failed to load users')).toBeInTheDocument()
	})

	it('should not render data table when there is an error', async () => {
		usersApiMock.getAll.mockReturnValue(throwError(() => new Error('Network error')))

		await renderComponent()

		expect(screen.queryByRole('table')).not.toBeInTheDocument()
	})

	it('should not render alert when loading', async () => {
		usersApiMock.getAll.mockReturnValue(NEVER)

		await renderComponent()

		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('should show confirm dialog when delete button is clicked', async () => {
		const users = [createMockManagedUser({ id: 1, firstName: 'John', lastName: 'Doe' })]
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))

		await renderComponent()

		fireEvent.click(screen.getByRole('button', { name: /delete/i }))

		expect(screen.getByText(/are you sure you want to delete the user 'John Doe'/i)).toBeInTheDocument()
	})

	it('should call deleteUser when delete is confirmed', async () => {
		const users = [createMockManagedUser({ id: 42, firstName: 'Jane', lastName: 'Smith' })]
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))
		usersApiMock.delete.mockReturnValue(of(undefined))

		await renderComponent()

		fireEvent.click(screen.getByRole('button', { name: /delete/i }))

		const dialog = screen.getByRole('alertdialog')
		fireEvent.click(within(dialog).getByRole('button', { name: /delete/i }))

		expect(usersApiMock.delete.calls).toHaveLength(1)
		expect(usersApiMock.delete.calls[0][0]).toBe(42)
	})

	describe('permission-conditional rendering', () => {
		async function renderWithPermissions(allowedPermissions: string[]) {
			const users = [createMockManagedUser()]
			usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse(users)))

			const view = await render(UsersList, {
				providers: [
					{ provide: UsersApi, useValue: usersApiMock },
					{ provide: RolesApi, useValue: rolesApiMock },
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

		it('should hide create button when user lacks users:create', async () => {
			await renderWithPermissions(['users:read', 'users:update', 'users:delete'])

			expect(screen.queryByRole('button', { name: /create user/i })).not.toBeInTheDocument()
		})

		it('should hide edit button when user lacks users:update', async () => {
			await renderWithPermissions(['users:read', 'users:delete'])

			expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
		})

		it('should hide delete button when user lacks users:delete', async () => {
			await renderWithPermissions(['users:read', 'users:update'])

			expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
		})

		it('should not render actions column when user lacks both update and delete', async () => {
			await renderWithPermissions(['users:read', 'users:create'])

			expect(screen.queryByRole('columnheader', { name: /actions/i })).not.toBeInTheDocument()
		})
	})
})
