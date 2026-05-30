import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router'
import { UserStatus } from '@contracts/user/user.constants'
import { createPaginatedResponse } from '@mocks/pagination.mock'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { mockTranslation } from '@providers/i18n/translation.mock'
import { RolesApi } from '@providers/roles/roles.interface'
import { UsersApi } from '@providers/users/users.interface'
import { createMockManagedUser } from '@providers/users/users.mock'
import { CURRENT_USER_SOURCE } from '@resetshop/angular-core/auth/current-user.token'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	type MockFn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { render, screen } from '@testing-library/angular'
import { of } from 'rxjs'
import UserDetailPage from './user-detail-page'

describe('UserDetailPage', () => {
	let usersApiMock: Record<keyof UsersApi, MockFn>
	let rolesApiMock: Record<keyof RolesApi, MockFn>

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		usersApiMock = {
			getAll: fn(),
			getById: fn(),
			create: fn(),
			update: fn(),
			delete: fn(),
			updateStatus: fn(),
			resetPassword: fn(),
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
		rolesApiMock.getAllUnpaginated.mockReturnValue(of([]))
	})

	afterEach(() => useRealTimers())

	async function renderPage(routeId: string) {
		const view = await render(UserDetailPage, {
			providers: [
				provideRouter([]),
				{ provide: UsersApi, useValue: usersApiMock },
				{ provide: RolesApi, useValue: rolesApiMock },
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
				{ provide: CURRENT_USER_SOURCE, useExisting: AuthStore },
				{ provide: Translation, useValue: mockTranslation },
				{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: routeId }) } } },
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(createMockUser({ id: 999, hasPermission: () => true }))
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	it('loads the user identified by the route id', async () => {
		usersApiMock.getById.mockReturnValue(of(createMockManagedUser({ id: 12 })))

		await renderPage('12')

		expect(usersApiMock.getById.calls).toHaveLength(1)
		expect(usersApiMock.getById.calls[0][0]).toBe(12)
	})

	it('renders the user sections once loaded', async () => {
		usersApiMock.getById.mockReturnValue(
			of(createMockManagedUser({ id: 1, firstName: 'Ada', lastName: 'Lovelace', status: UserStatus.ACTIVE })),
		)

		await renderPage('1')

		expect(screen.getByText('Profile')).toBeInTheDocument()
		expect(screen.getByText('Roles')).toBeInTheDocument()
		expect(screen.getByText('Account Actions')).toBeInTheDocument()
		expect(screen.getByText('Active')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /back to users/i })).toBeInTheDocument()
	})
})
