import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import type { DurationString } from '@contracts/common/duration.schemas'
import { UserRole } from '@contracts/permission/permission.constants'
import type { UserDto } from '@contracts/user/user.types'
import { mapUserDtoToUser } from '@domain/user/user.mapper'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { createMockUserDto } from '@mocks/user-dto.mock'
import { createMockUser } from '@mocks/user.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import { InMemoryUserApi, provideUserMock } from '@providers/user/user.mock'
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
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../../settings.constants'
import { UserDrawer } from './user-drawer'

describe('UserDrawer', () => {
	let api: InMemoryUserApi

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		api = new InMemoryUserApi()
	})

	afterEach(() => {
		useRealTimers()
	})

	async function renderDrawer() {
		const view = await render(UserDrawer, {
			providers: [
				provideUserMock(api),
				provideSliceTranslationMock(settingsEn),
				{
					provide: AuthStore,
					useValue: {
						currentUser: signal(createMockUser({ hasRole: (id: number) => id === UserRole.ADMIN })),
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

	async function openCreate() {
		const view = await renderDrawer()
		view.fixture.componentInstance.openCreate()
		await settle(view)
		return view
	}

	async function openEdit(dto: UserDto) {
		api.seed([dto])
		const view = await renderDrawer()
		view.fixture.componentInstance.openEdit(mapUserDtoToUser(dto))
		await settle(view)
		return view
	}

	function savedUsers(): UserDto[] {
		let users: UserDto[] = []
		api.getAll().subscribe((result) => (users = result))
		return users
	}

	function fillValidCreateForm(view: { fixture: { detectChanges(): void } }): void {
		fireEvent.input(screen.getByRole('textbox', { name: /first name/i }), { target: { value: 'Ana' } })
		fireEvent.input(screen.getByRole('textbox', { name: /last name/i }), { target: { value: 'Gomez' } })
		fireEvent.input(screen.getByRole('textbox', { name: /username/i }), { target: { value: 'agomez' } })
		fireEvent.input(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'ana@example.com' } })
		fireEvent.click(screen.getByRole('checkbox', { name: 'Employee' }))
		view.fixture.detectChanges()
	}

	describe('creating', () => {
		it('should render the create title and an empty form', async () => {
			await openCreate()

			expect(screen.getByRole('dialog', { name: 'Create user' })).toBeInTheDocument()
			expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue('')
			expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
		})

		it('should register the user with the chosen roles on submit', async () => {
			const view = await openCreate()

			fillValidCreateForm(view)
			fireEvent.click(screen.getByRole('button', { name: 'Create' }))
			view.fixture.detectChanges()

			expect(savedUsers()).toEqual([
				expect.objectContaining({
					firstName: 'Ana',
					lastName: 'Gomez',
					userName: 'agomez',
					email: 'ana@example.com',
					roles: [{ id: 6, description: 'EMPLOYEE' }],
				}),
			])
		})

		it.each([
			['first name is empty', /first name/i, ''],
			['last name is empty', /last name/i, ''],
			['user name is empty', /username/i, ''],
			['email is invalid', /email/i, 'not-an-email'],
			['first name is too long', /first name/i, 'A'.repeat(101)],
		])('should keep the create button disabled when %s', async (_case, field, value) => {
			const view = await openCreate()

			fillValidCreateForm(view)
			fireEvent.input(screen.getByRole('textbox', { name: field }), { target: { value } })
			view.fixture.detectChanges()

			expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
		})

		it('should show the error and stay open when registration fails', async () => {
			api.setError('register', new Error('conflict'))
			const view = await openCreate()

			fillValidCreateForm(view)
			fireEvent.click(screen.getByRole('button', { name: 'Create' }))
			view.fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Failed to create user')
			expect(screen.getByRole('dialog', { name: 'Create user' })).toBeInTheDocument()
		})

		it('should show a spinner while saving', async () => {
			const view = await openCreate()

			fillValidCreateForm(view)
			fireEvent.click(screen.getByRole('button', { name: 'Create' }))
			TestBed.tick()
			view.fixture.detectChanges()

			expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled()
		})

		it('should clear the form after a successful creation and announce it', async () => {
			const view = await openCreate()
			const firstName = screen.getByRole('textbox', { name: /first name/i })

			fillValidCreateForm(view)
			fireEvent.click(screen.getByRole('button', { name: 'Create' }))
			TestBed.tick()
			await settle(view, DRAWER_CLOSE_AFTER_SUCCESS_DELAY)
			fireEvent.transitionEnd(screen.getByRole('dialog'))
			view.fixture.detectChanges()

			expect(firstName).toHaveValue('')
			expect(
				TestBed.inject(UIStore)
					.notifications()
					.map((item) => item.message),
			).toContain('User created successfully.')
		})
	})

	describe('editing', () => {
		const dto = createMockUserDto({
			id: 7,
			firstName: 'Bruno',
			lastName: 'Diaz',
			userName: 'bdiaz',
			email: 'bruno@example.com',
			roles: [{ id: 2, description: 'OWNER' }],
		})

		it('should load the user into the form with the username read-only', async () => {
			await openEdit(dto)

			expect(screen.getByRole('dialog', { name: 'Edit user' })).toBeInTheDocument()
			expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue('Bruno')
			expect(screen.getByRole('textbox', { name: /last name/i })).toHaveValue('Diaz')
			expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('bruno@example.com')
			expect(screen.queryByRole('textbox', { name: /username/i })).not.toBeInTheDocument()
			expect(screen.getByTestId('user-name-readonly')).toHaveTextContent('bdiaz')
			expect(screen.getByRole('checkbox', { name: 'Owner' })).toBeChecked()
		})

		it('should keep save disabled until something changes', async () => {
			const view = await openEdit(dto)
			expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

			fireEvent.input(screen.getByRole('textbox', { name: /first name/i }), { target: { value: 'Bruno B.' } })
			view.fixture.detectChanges()

			expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
		})

		it('should send the edited fields and roles, never the user name', async () => {
			const view = await openEdit(dto)

			fireEvent.input(screen.getByRole('textbox', { name: /first name/i }), { target: { value: 'Bruno B.' } })
			fireEvent.click(screen.getByRole('checkbox', { name: 'Accountant' }))
			view.fixture.detectChanges()
			fireEvent.click(screen.getByRole('button', { name: 'Save' }))
			view.fixture.detectChanges()

			expect(savedUsers()[0]).toEqual(
				expect.objectContaining({
					id: 7,
					firstName: 'Bruno B.',
					userName: 'bdiaz',
					roles: [
						{ id: 2, description: 'OWNER' },
						{ id: 7, description: 'ACCOUNTANT' },
					],
				}),
			)
		})

		it('should show the error and stay open when the update fails', async () => {
			api.setError('update', new Error('boom'))
			const view = await openEdit(dto)

			fireEvent.input(screen.getByRole('textbox', { name: /first name/i }), { target: { value: 'Bruno B.' } })
			view.fixture.detectChanges()
			fireEvent.click(screen.getByRole('button', { name: 'Save' }))
			view.fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Failed to update user')
			expect(screen.getByRole('dialog', { name: 'Edit user' })).toBeInTheDocument()
		})

		it('should announce a successful update', async () => {
			const view = await openEdit(dto)

			fireEvent.input(screen.getByRole('textbox', { name: /first name/i }), { target: { value: 'Bruno B.' } })
			view.fixture.detectChanges()
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
	})

	it('should ask for confirmation before discarding a dirty form', async () => {
		const view = await openCreate()

		fireEvent.input(screen.getByRole('textbox', { name: /first name/i }), { target: { value: 'Ana' } })
		view.fixture.detectChanges()
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
		view.fixture.detectChanges()

		expect(screen.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeInTheDocument()
	})
})
