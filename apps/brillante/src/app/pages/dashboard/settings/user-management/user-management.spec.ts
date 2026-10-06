import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { UserStatus } from '@contracts/user/user.constants'
import type { ManagedUser as ManagedUserDto } from '@contracts/user/user.types'
import { createManagedUserDto } from '@domain/user/managed-user.mock'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { type Observable, of } from 'rxjs'
import { InMemoryManagedUsersApi, provideManagedUsersMock } from './managed-users.mock'
import UserManagement from './user-management'

describe('UserManagement', () => {
	let api: InMemoryManagedUsersApi

	const role = (id: number, name: string): ManagedUserDto['roles'][number] => ({
		id,
		name,
		code: name.toLowerCase(),
		description: null,
		removable: false,
		createdAt: null,
		updatedAt: null,
	})
	const ana = createManagedUserDto({
		id: 1,
		firstName: 'Ana',
		lastName: 'Gomez',
		email: 'ana@shop.com',
		roles: [role(1, 'Administrator'), role(6, 'Employee')],
	})
	const bruno = createManagedUserDto({
		id: 2,
		firstName: 'Bruno',
		lastName: 'Diaz',
		email: 'bruno@shop.com',
		roles: [],
	})

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		api = new InMemoryManagedUsersApi()
		api.seed([ana, bruno])
	})

	afterEach(() => {
		useRealTimers()
		// The row-actions menu attaches its popover to a portal on `document.body`, outside the
		// fixture's view tree; remove leftovers so later tests do not see duplicate menus.
		screen.queryAllByTestId('row-actions-menu').forEach((menu) => menu.remove())
	})

	async function renderPage() {
		const view = await render(UserManagement, {
			providers: [
				provideAuthMock(),
				provideManagedUsersMock(api),
				provideSliceTranslationMock(settingsEn),
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(createMockUser({ id: 1 }))
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	async function openRowMenu(name: RegExp): Promise<void> {
		fireEvent.click(within(screen.getByRole('row', { name })).getByRole('button', { name: 'Actions' }))
		TestBed.tick()
		await advanceTimersByTimeAsync(50)
	}

	function savedUsers(): ManagedUserDto[] {
		let users: ManagedUserDto[] = []
		api.getAll().subscribe((result) => (users = result))
		return users
	}

	function notificationMessages(): string[] {
		return TestBed.inject(UIStore)
			.notifications()
			.map((item) => item.message)
	}

	it('should list every user with email, translated roles and status', async () => {
		await renderPage()

		const anaRow = screen.getByRole('row', { name: /Ana Gomez/ })
		expect(anaRow).toHaveTextContent('ana@shop.com')
		expect(anaRow).toHaveTextContent('Administrator, Employee')
		expect(anaRow).toHaveTextContent('Active')
		expect(screen.getByRole('row', { name: /Bruno Diaz/ })).toHaveTextContent('No roles')
	})

	it('should show a disabled user as disabled', async () => {
		api.seed([ana, createManagedUserDto({ ...bruno, status: UserStatus.DISABLED })])

		await renderPage()

		expect(screen.getByRole('row', { name: /Bruno Diaz/ })).toHaveTextContent('Disabled')
	})

	it('should not offer creating users', async () => {
		await renderPage()

		expect(screen.queryByRole('button', { name: /create user/i })).not.toBeInTheDocument()
	})

	it('should show the read error when the users cannot be loaded', async () => {
		api.setError('getAll', new Error('boom'))

		await renderPage()

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to load users')
	})

	it('should narrow the list to the users matching the search', async () => {
		const view = await renderPage()

		fireEvent.input(screen.getByRole('searchbox', { name: 'Search users...' }), { target: { value: 'bruno' } })
		view.fixture.detectChanges()

		expect(screen.queryByRole('row', { name: /Ana Gomez/ })).not.toBeInTheDocument()
		expect(screen.getByRole('row', { name: /Bruno Diaz/ })).toBeInTheDocument()
	})

	it('should open the edit drawer with the chosen user', async () => {
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
		await advanceTimersByTimeAsync(500)
		view.fixture.detectChanges()

		expect(screen.getByRole('dialog', { name: 'Edit user' })).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue('Bruno')
	})

	it('should disable an active user and announce it', async () => {
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Disable' }))
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()

		expect(savedUsers().find((user) => user.id === 2)?.status).toBe(UserStatus.DISABLED)
		expect(screen.getByRole('row', { name: /Bruno Diaz/ })).toHaveTextContent('Disabled')
		expect(notificationMessages()).toEqual(['User updated successfully.'])
	})

	it('should offer enabling a disabled user', async () => {
		api.seed([ana, createManagedUserDto({ ...bruno, status: UserStatus.DISABLED })])
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Enable' }))
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()

		expect(savedUsers().find((user) => user.id === 2)?.status).toBe(UserStatus.ACTIVE)
	})

	it('should announce the failure when a status change fails', async () => {
		api.setError('update', new Error('boom'))
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Disable' }))
		TestBed.tick()
		view.fixture.detectChanges()

		expect(notificationMessages()).toEqual(['Failed to update user'])
		expect(savedUsers().find((user) => user.id === 2)?.status).toBe(UserStatus.ACTIVE)
	})

	it('should delete a user after confirmation and announce it', async () => {
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
		view.fixture.detectChanges()

		expect(
			screen.getByText("Are you sure you want to delete 'Bruno Diaz'? This action cannot be undone."),
		).toBeInTheDocument()

		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()

		expect(savedUsers().map((user) => user.id)).toEqual([1])
		expect(screen.queryByRole('row', { name: /Bruno Diaz/ })).not.toBeInTheDocument()
		expect(notificationMessages()).toEqual(['User deleted successfully.'])
	})

	it('should not delete anything when the confirmation is cancelled', async () => {
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
		view.fixture.detectChanges()
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))
		view.fixture.detectChanges()

		expect(savedUsers()).toHaveLength(2)
	})

	it('should announce the failure when a user cannot be deleted', async () => {
		api.setError('delete', new Error('boom'))
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
		view.fixture.detectChanges()
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
		TestBed.tick()
		view.fixture.detectChanges()

		expect(notificationMessages()).toEqual(['Failed to delete user'])
		expect(savedUsers()).toHaveLength(2)
	})

	it('should reset the password of a user after confirmation and announce it', async () => {
		const resetPassword = fn<[number], Observable<unknown>>()
		resetPassword.mockReturnValue(of({ message: 'ok' }))
		api.resetPassword = resetPassword
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Reset password' }))
		view.fixture.detectChanges()

		expect(screen.getByText(/A temporary password will be emailed to bruno@shop.com/)).toBeInTheDocument()

		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Reset password' }))
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()

		expect(resetPassword.calls).toEqual([[2]])
		expect(notificationMessages()).toEqual(['Password reset. The temporary password is being emailed to the user.'])
	})

	it('should not offer resetting the password of a disabled user', async () => {
		api.seed([ana, createManagedUserDto({ ...bruno, status: UserStatus.DISABLED })])
		await renderPage()

		await openRowMenu(/Bruno Diaz/)

		expect(screen.getByRole('menuitem', { name: 'Enable' })).toBeInTheDocument()
		expect(screen.queryByRole('menuitem', { name: 'Reset password' })).not.toBeInTheDocument()
	})

	it('should not reset anything when the confirmation is cancelled', async () => {
		const resetPassword = fn<[number], Observable<unknown>>()
		resetPassword.mockReturnValue(of({ message: 'ok' }))
		api.resetPassword = resetPassword
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Reset password' }))
		view.fixture.detectChanges()
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))
		view.fixture.detectChanges()

		expect(resetPassword.calls).toEqual([])
	})

	it('should announce the failure when the password cannot be reset', async () => {
		api.setError('resetPassword', new Error('boom'))
		const view = await renderPage()

		await openRowMenu(/Bruno Diaz/)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Reset password' }))
		view.fixture.detectChanges()
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Reset password' }))
		TestBed.tick()
		view.fixture.detectChanges()

		expect(notificationMessages()).toEqual(['Failed to reset the password'])
	})

	it('should only offer editing the signed-in user, never disabling, resetting or deleting', async () => {
		await renderPage()

		await openRowMenu(/Ana Gomez/)

		expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
		expect(screen.queryByRole('menuitem', { name: 'Disable' })).not.toBeInTheDocument()
		expect(screen.queryByRole('menuitem', { name: 'Reset password' })).not.toBeInTheDocument()
		expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument()
	})
})
