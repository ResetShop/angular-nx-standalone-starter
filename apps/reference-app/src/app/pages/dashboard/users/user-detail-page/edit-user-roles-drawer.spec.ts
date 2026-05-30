import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import type { ManagedUser } from '@contracts/user/user.types'
import { mapManagedUserResponse } from '@domain/user-management/managed-user.mapper'
import { createPaginatedResponse } from '@mocks/pagination.mock'
import { mockTranslation } from '@providers/i18n/translation.mock'
import { RolesApi } from '@providers/roles/roles.interface'
import { UsersApi } from '@providers/users/users.interface'
import { createMockManagedUser } from '@providers/users/users.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { fireEvent, render, screen } from '@testing-library/angular'
import { of } from 'rxjs'
import { EditUserRolesDrawer } from './edit-user-roles-drawer'

function buildUser(overrides: Partial<ManagedUser> = {}) {
	return mapManagedUserResponse(createMockManagedUser(overrides))
}

const ROLES = [
	{ id: 1, name: 'Admin', code: 'admin', description: null, removable: true, createdAt: null, updatedAt: null },
	{ id: 2, name: 'Editor', code: 'editor', description: null, removable: true, createdAt: null, updatedAt: null },
]

describe('EditUserRolesDrawer', () => {
	let usersApiMock: Record<keyof UsersApi, MockFn>
	let rolesApiMock: Record<keyof RolesApi, MockFn>

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
		usersApiMock.update.mockReturnValue(of(createMockManagedUser()))
		rolesApiMock.getAllUnpaginated.mockReturnValue(of(ROLES))
	})

	async function renderDrawer(overrides: Partial<ManagedUser> = {}) {
		const view = await render(EditUserRolesDrawer, {
			inputs: { user: buildUser(overrides) },
			providers: [
				{ provide: UsersApi, useValue: usersApiMock },
				{ provide: RolesApi, useValue: rolesApiMock },
				{ provide: Translation, useValue: mockTranslation },
				...provideSignalFormsConfig({}),
			],
		})
		return view
	}

	it('saves the updated role selection via updateUser', async () => {
		const view = await renderDrawer({ id: 8, roles: [ROLES[0]] })
		view.fixture.componentInstance.open()
		TestBed.tick()
		view.fixture.detectChanges()

		// Add the Editor role on top of the pre-selected Admin role.
		fireEvent.click(screen.getByRole('checkbox', { name: /editor/i }))
		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		TestBed.tick()

		expect(usersApiMock.update.calls).toHaveLength(1)
		expect(usersApiMock.update.calls[0][0]).toBe(8)
		expect(usersApiMock.update.calls[0][1].roleIds).toEqual([1, 2])
	})
})
