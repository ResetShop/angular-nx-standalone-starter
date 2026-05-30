import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { PERMISSION_DEFINITIONS } from '@contracts/permission/permission.constants'
import type { ManagedUser } from '@contracts/user/user.types'
import { mapManagedUserResponse } from '@domain/user-management/managed-user.mapper'
import { createPaginatedResponse } from '@mocks/pagination.mock'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { mockTranslation } from '@providers/i18n/translation.mock'
import { UsersApi } from '@providers/users/users.interface'
import { createMockManagedUser } from '@providers/users/users.mock'
import { CURRENT_USER_SOURCE } from '@resetshop/angular-core/auth/current-user.token'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks, fn, type MockFn, spyOn } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { of } from 'rxjs'
import { UserDangerZone } from './user-danger-zone'

function buildUser(overrides: Partial<ManagedUser> = {}) {
	return mapManagedUserResponse(createMockManagedUser(overrides))
}

describe('UserDangerZone', () => {
	let usersApiMock: Record<keyof UsersApi, MockFn>

	beforeEach(() => {
		clearAllMocks()
		usersApiMock = {
			getAll: fn(),
			getById: fn(),
			create: fn(),
			update: fn(),
			delete: fn(),
			updateStatus: fn(),
			resetPassword: fn(),
		}
		usersApiMock.getAll.mockReturnValue(of(createPaginatedResponse([])))
		usersApiMock.delete.mockReturnValue(of(undefined))
	})

	async function renderZone(permissions: string[], overrides: Partial<ManagedUser> = {}) {
		const view = await render(UserDangerZone, {
			inputs: { user: buildUser({ id: 1, ...overrides }) },
			providers: [
				provideRouter([]),
				{ provide: UsersApi, useValue: usersApiMock },
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
				{ provide: CURRENT_USER_SOURCE, useExisting: AuthStore },
				{ provide: Translation, useValue: mockTranslation },
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(
			createMockUser({ id: 999, hasPermission: (id) => permissions.includes(id) }),
		)
		view.fixture.detectChanges()
		return view
	}

	it('hides the danger zone when the target user is the current user', async () => {
		const view = await render(UserDangerZone, {
			inputs: { user: buildUser({ id: 42 }) },
			providers: [
				provideRouter([]),
				{ provide: UsersApi, useValue: usersApiMock },
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
				{ provide: CURRENT_USER_SOURCE, useExisting: AuthStore },
				{ provide: Translation, useValue: mockTranslation },
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(createMockUser({ id: 42, hasPermission: () => true }))
		view.fixture.detectChanges()

		expect(screen.queryByRole('button', { name: /delete user/i })).not.toBeInTheDocument()
	})

	it('hides the delete button without admin:users:delete', async () => {
		await renderZone(['admin:users:read'])

		expect(screen.queryByRole('button', { name: /delete user/i })).not.toBeInTheDocument()
	})

	it('deletes the user and navigates back to the list on success', async () => {
		await renderZone(['admin:users:delete'], { id: 7 })
		const navigateSpy = spyOn(TestBed.inject(Router), 'navigate')

		fireEvent.click(screen.getByRole('button', { name: /delete user/i }))
		TestBed.tick()
		const dialog = screen.getByRole('alertdialog')
		fireEvent.click(within(dialog).getByRole('button', { name: /delete/i }))
		TestBed.tick()

		expect(usersApiMock.delete.calls).toHaveLength(1)
		expect(usersApiMock.delete.calls[0][0]).toBe(7)
		expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/users'])
	})
})

describe('permission identifiers', () => {
	const validIdentifiers = new Set(PERMISSION_DEFINITIONS.map((p) => p.identifier))

	it('should use valid permission identifiers', () => {
		expect(validIdentifiers.has('admin:users:delete')).toBe(true)
	})
})
