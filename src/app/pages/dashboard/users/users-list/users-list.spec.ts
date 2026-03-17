import { TestBed } from '@angular/core/testing'
import type { PaginatedResponse } from '@contracts/common/pagination.types'
import type { ManagedUser } from '@contracts/user/user.types'
import { Translation } from '@providers/i18n/translation'
import { RolesApi } from '@providers/roles/roles.interface'
import { UsersApi } from '@providers/users/users.interface'
import { clearAllMocks, fn, type MockFn, spyOn } from '@test-utils'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import UsersList from './users-list'

function createMockManagedUser(overrides: Partial<ManagedUser> = {}): ManagedUser {
	return {
		id: 1,
		email: 'john@example.com',
		firstName: 'John',
		lastName: 'Doe',
		status: 'active',
		statusChangedAt: null,
		statusChangedBy: null,
		deletedAt: null,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		roles: [],
		...overrides,
	}
}

function createPaginatedResponse(data: ManagedUser[], total?: number): PaginatedResponse<ManagedUser> {
	return { data, total: total ?? data.length, limit: 10, offset: 0 }
}

const TRANSLATIONS: Record<string, string> = {
	'DATA_TABLE.EMPTY': 'No data available',
	'DATA_TABLE.LOADING': 'Loading...',
	'PAGINATION.LABEL': 'Pagination',
	'PAGINATION.ROWS_PER_PAGE': 'Rows per page',
	'PAGINATION.GO_TO_PREVIOUS': 'Previous page',
	'PAGINATION.GO_TO_NEXT': 'Next page',
	'PAGINATION.GO_TO_PAGE': 'Go to page {page}',
}

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
}

describe('UsersList', () => {
	let usersApiMock: Record<keyof UsersApi, MockFn>
	let rolesApiMock: Record<keyof RolesApi, MockFn>

	beforeEach(() => {
		clearAllMocks()
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

	async function renderComponent() {
		await render(UsersList, {
			providers: [
				{ provide: UsersApi, useValue: usersApiMock },
				{ provide: RolesApi, useValue: rolesApiMock },
				{ provide: Translation, useValue: mockTranslation },
			],
		})
		TestBed.tick()
	}

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
		expect(screen.getByText('Error')).toBeInTheDocument()
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
})
