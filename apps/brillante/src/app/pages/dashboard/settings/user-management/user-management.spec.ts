import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import type { UserDto } from '@contracts/user/legacy-user.types'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { createMockUserDto } from '@mocks/user-dto.mock'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import { InMemoryUserApi, provideUserMock } from '@providers/user/user.mock'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import UserManagement from './user-management'

describe('UserManagement', () => {
	let api: InMemoryUserApi

	const ana = createMockUserDto({
		id: 1,
		firstName: 'Ana',
		lastName: 'Gomez',
		userName: 'agomez',
		email: 'ana@shop.com',
		roles: [
			{ id: 1, description: 'ADMIN' },
			{ id: 6, description: 'EMPLOYEE' },
		],
	})
	const bruno = createMockUserDto({
		id: 2,
		firstName: 'Bruno',
		lastName: 'Diaz',
		userName: 'bdiaz',
		email: 'bruno@shop.com',
		roles: [],
	})

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		api = new InMemoryUserApi()
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
				provideUserMock(api),
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

	function savedUsers(): UserDto[] {
		let users: UserDto[] = []
		api.getAll().subscribe((result) => (users = result))
		return users
	}

	it('should list every user with username, email and translated roles', async () => {
		await renderPage()

		const anaRow = screen.getByRole('row', { name: /Ana Gomez/ })
		expect(anaRow).toHaveTextContent('agomez')
		expect(anaRow).toHaveTextContent('ana@shop.com')
		expect(anaRow).toHaveTextContent('Administrator, Employee')
		expect(screen.getByRole('row', { name: /Bruno Diaz/ })).toHaveTextContent('No roles')
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

	it('should open the create drawer', async () => {
		const view = await renderPage()

		fireEvent.click(screen.getByRole('button', { name: 'Create user' }))
		view.fixture.detectChanges()

		expect(screen.getByRole('dialog', { name: 'Create user' })).toBeInTheDocument()
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
		expect(
			TestBed.inject(UIStore)
				.notifications()
				.map((item) => item.message),
		).toEqual(['User deleted successfully.'])
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

		expect(
			TestBed.inject(UIStore)
				.notifications()
				.map((item) => item.message),
		).toEqual(['Failed to delete user'])
		expect(savedUsers()).toHaveLength(2)
	})

	it('should not offer deleting the signed-in user', async () => {
		await renderPage()

		await openRowMenu(/Ana Gomez/)

		expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
		expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument()
	})
})
