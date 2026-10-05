import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import type { DurationString } from '@contracts/common/duration.schemas'
import { UserRole } from '@contracts/permission/legacy-permission.constants'
import { UserStatus } from '@contracts/user/user.constants'
import type { UpdateUserRequest } from '@contracts/user/user.types'
import type { ManagedUser } from '@domain/user/managed-user.interface'
import { mapManagedUserDto } from '@domain/user/managed-user.mapper'
import { createManagedUserDto } from '@domain/user/managed-user.mock'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { createMockUser } from '@mocks/user.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import { DRAWER_SPINNER_MIN_DISPLAY } from '@resetshop/ui/drawer/drawer-loading'
import { parseDurationToMs } from '@resetshop/util'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen } from '@testing-library/angular'
import { type Observable } from 'rxjs'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../../settings.constants'
import { InMemoryManagedUsersApi, provideManagedUsersMock } from '../managed-users.mock'
import { ManagedUsersStore } from '../managed-users.store'
import { UserDrawer } from './user-drawer'

/** Records what the drawer asks the backend to change. */
class RecordingManagedUsersApi extends InMemoryManagedUsersApi {
	public readonly updates: { id: number; body: UpdateUserRequest }[] = []

	public override update(id: number, body: UpdateUserRequest): Observable<never> {
		this.updates.push({ id, body })
		return super.update(id, body) as Observable<never>
	}
}

describe('UserDrawer', () => {
	let api: RecordingManagedUsersApi

	const dto = createManagedUserDto({
		id: 7,
		firstName: 'Bruno',
		lastName: 'Diaz',
		email: 'bruno@example.com',
		roles: [
			{
				id: 2,
				code: 'owner',
				name: 'Owner',
				description: null,
				removable: false,
				createdAt: null,
				updatedAt: null,
			},
		],
	})
	const bruno: ManagedUser = mapManagedUserDto(dto)

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		api = new RecordingManagedUsersApi()
		api.seed([dto])
	})

	afterEach(() => {
		useRealTimers()
	})

	async function renderDrawer(signedInUserId = 1) {
		const view = await render(UserDrawer, {
			providers: [
				provideManagedUsersMock(api),
				provideSliceTranslationMock(settingsEn),
				{
					provide: AuthStore,
					useValue: {
						currentUser: signal(createMockUser({ id: signedInUserId, hasRole: (id: number) => id === UserRole.ADMIN })),
					},
				},
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.tick()
		return view
	}

	async function settle(
		view: { fixture: { detectChanges(): void } },
		time: DurationString = DRAWER_SPINNER_MIN_DISPLAY,
	) {
		await advanceTimersByTimeAsync(parseDurationToMs(time))
		view.fixture.detectChanges()
	}

	async function openEdit(user: ManagedUser = bruno, signedInUserId = 1) {
		const view = await renderDrawer(signedInUserId)
		view.fixture.componentInstance.openEdit(user)
		await settle(view)
		return view
	}

	function rename(view: { fixture: { detectChanges(): void } }, firstName = 'Bruno B.'): void {
		fireEvent.input(screen.getByRole('textbox', { name: /first name/i }), { target: { value: firstName } })
		view.fixture.detectChanges()
	}

	it('should load the user into the form', async () => {
		await openEdit()

		expect(screen.getByRole('dialog', { name: 'Edit user' })).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue('Bruno')
		expect(screen.getByRole('textbox', { name: /last name/i })).toHaveValue('Diaz')
		expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('bruno@example.com')
		expect(screen.getByRole('checkbox', { name: 'Owner' })).toBeChecked()
		expect(screen.queryByRole('textbox', { name: /username/i })).not.toBeInTheDocument()
	})

	it('should keep save disabled until something changes', async () => {
		const view = await openEdit()
		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

		rename(view)

		expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
	})

	it.each([
		['first name is empty', /first name/i, ''],
		['last name is empty', /last name/i, ''],
		['email is invalid', /email/i, 'not-an-email'],
		['first name is too long', /first name/i, 'A'.repeat(101)],
	])('should keep save disabled when %s', async (_case, field, value) => {
		const view = await openEdit()

		fireEvent.input(screen.getByRole('textbox', { name: field }), { target: { value } })
		view.fixture.detectChanges()

		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
	})

	it('should send only the fields that changed', async () => {
		const view = await openEdit()

		rename(view)
		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		view.fixture.detectChanges()

		expect(api.updates).toEqual([{ id: 7, body: { firstName: 'Bruno B.' } }])
	})

	it('should keep a role the backend will not let go of checked and disabled', async () => {
		await openEdit()

		expect(screen.getByRole('checkbox', { name: 'Owner' })).toBeDisabled()
		expect(screen.getByRole('checkbox', { name: 'Owner' })).toBeChecked()
		expect(screen.getByText('Roles already assigned cannot be removed.')).toBeInTheDocument()
	})

	it('should let a removable role be unchecked and send the remaining roles', async () => {
		const view = await openEdit(
			mapManagedUserDto(
				createManagedUserDto({
					...dto,
					roles: [
						{ ...dto.roles[0], removable: true },
						{ ...dto.roles[0], id: 7, code: 'accountant', name: 'Accountant', removable: true },
					],
				}),
			),
		)

		fireEvent.click(screen.getByRole('checkbox', { name: 'Accountant' }))
		view.fixture.detectChanges()
		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		view.fixture.detectChanges()

		expect(api.updates).toEqual([{ id: 7, body: { roleIds: [2] } }])
	})

	it('should keep save disabled when an edit is reverted', async () => {
		const view = await openEdit()

		rename(view)
		rename(view, 'Bruno')

		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
	})

	it('should not show the error of an earlier failed change when opened', async () => {
		api.setError('update', new Error('boom'))
		const view = await renderDrawer()
		TestBed.inject(ManagedUsersStore).updateUser({ id: 7, changes: { status: UserStatus.DISABLED } })

		view.fixture.componentInstance.openEdit(bruno)
		await settle(view)

		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('should send the role ids when the roles change', async () => {
		const view = await openEdit()

		fireEvent.click(screen.getByRole('checkbox', { name: 'Accountant' }))
		view.fixture.detectChanges()
		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		view.fixture.detectChanges()

		expect(api.updates).toEqual([{ id: 7, body: { roleIds: [2, 7] } }])
	})

	it('should not offer changing the roles of the signed-in user', async () => {
		const view = await openEdit(bruno, bruno.id)

		expect(screen.queryByRole('checkbox', { name: 'Owner' })).not.toBeInTheDocument()
		expect(screen.getByText('You cannot change your own roles.')).toBeInTheDocument()

		rename(view)
		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		view.fixture.detectChanges()

		expect(api.updates).toEqual([{ id: 7, body: { firstName: 'Bruno B.' } }])
	})

	it('should show the error and stay open when the update fails', async () => {
		api.setError('update', new Error('boom'))
		const view = await openEdit()

		rename(view)
		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		view.fixture.detectChanges()

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to update user')
		expect(screen.getByRole('dialog', { name: 'Edit user' })).toBeInTheDocument()
	})

	it('should show a spinner while saving', async () => {
		const view = await openEdit()

		rename(view)
		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		TestBed.tick()
		view.fixture.detectChanges()

		expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
	})

	it('should announce a successful update', async () => {
		const view = await openEdit()

		rename(view)
		fireEvent.click(screen.getByRole('button', { name: 'Save' }))
		TestBed.tick()
		await settle(view, DRAWER_CLOSE_AFTER_SUCCESS_DELAY)
		fireEvent.transitionEnd(screen.getByRole('dialog'))
		view.fixture.detectChanges()

		expect(
			TestBed.inject(UIStore)
				.notifications()
				.map((item) => item.message),
		).toContain('User updated successfully.')
	})

	it('should ask for confirmation before discarding a dirty form', async () => {
		const view = await openEdit()

		rename(view, 'Ana')
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		view.fixture.detectChanges()

		expect(screen.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeInTheDocument()
	})
})
