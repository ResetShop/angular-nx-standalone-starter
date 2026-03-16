import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { DRAWER_SPINNER_MIN_DISPLAY } from '@components/drawer/drawer-loading'
import { Translation } from '@providers/i18n/translation'
import { RolesApiService } from '@providers/roles/roles'
import { UsersApiService } from '@providers/users/users'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	type MockFn,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@test-utils'
import { fireEvent, render, screen } from '@testing-library/angular'
import { parseDurationToMs } from '@utils/duration'
import { of, throwError } from 'rxjs'
import { CreateUserDrawer } from './create-user-drawer'

const TRANSLATIONS: Record<string, string> = {
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.MAX_LENGTH': 'Maximum {max} characters',
	'VALIDATION.PATTERN': 'Invalid format',
}

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
}

describe('CreateUserDrawer', () => {
	let usersApiMock: Record<keyof UsersApiService, MockFn>
	let rolesApiMock: Record<keyof RolesApiService, MockFn>

	beforeEach(() => {
		useFakeTimers()
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

		usersApiMock.getAll.mockReturnValue(of({ data: [], total: 0, limit: 10, offset: 0 }))
		rolesApiMock.getAll.mockReturnValue(of({ data: [], total: 0, limit: 10, offset: 0 }))
		rolesApiMock.getAllUnpaginated.mockReturnValue(of([]))
	})

	afterEach(() => {
		useRealTimers()
	})

	async function renderAndOpenRaw() {
		const { fixture } = await render(CreateUserDrawer, {
			providers: [
				{ provide: UsersApiService, useValue: usersApiMock },
				{ provide: RolesApiService, useValue: rolesApiMock },
				{ provide: Translation, useValue: mockTranslation },
			],
		})
		TestBed.tick()
		fixture.componentInstance.open()
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		fixture.detectChanges()
		return { fixture }
	}

	async function renderAndOpen() {
		await renderAndOpenRaw()
	}

	it('should render drawer with create title', async () => {
		await renderAndOpen()

		expect(screen.getByText('Create User')).toBeInTheDocument()
	})

	it('should render first name, last name, and email form fields', async () => {
		await renderAndOpen()

		expect(screen.getByText('First Name')).toBeInTheDocument()
		expect(screen.getByText('Last Name')).toBeInTheDocument()
		expect(screen.getByText('Email')).toBeInTheDocument()
	})

	it('should render must change password checkbox', async () => {
		await renderAndOpen()

		expect(screen.getByRole('checkbox')).toBeInTheDocument()
		expect(screen.getByText(/must change password/i)).toBeInTheDocument()
	})

	it('should render create button', async () => {
		await renderAndOpen()

		expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
	})

	it('should render cancel button', async () => {
		await renderAndOpen()

		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
	})

	it('should call createUser with correct params on submit', async () => {
		usersApiMock.create.mockReturnValue(
			of({
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				status: 'active',
				statusChangedAt: null,
				statusChangedBy: null,
				deletedAt: null,
				createdAt: null,
				updatedAt: null,
				roles: [],
				passwordEmailSent: true,
			}),
		)
		const { fixture } = await renderAndOpenRaw()

		const firstNameInput = screen.getByRole('textbox', { name: /first name/i })
		const lastNameInput = screen.getByRole('textbox', { name: /last name/i })
		const emailInput = screen.getByRole('textbox', { name: /email/i })

		fireEvent.input(firstNameInput, { target: { value: 'John' } })
		fireEvent.input(lastNameInput, { target: { value: 'Doe' } })
		fireEvent.input(emailInput, { target: { value: 'john@example.com' } })
		fixture.detectChanges()

		fireEvent.click(screen.getByRole('button', { name: /create/i }))
		fixture.detectChanges()

		expect(usersApiMock.create.calls).toHaveLength(1)
		expect(usersApiMock.create.calls[0][0]).toEqual(
			expect.objectContaining({ email: 'john@example.com', firstName: 'John', lastName: 'Doe' }),
		)
	})

	it('should show error alert when creation fails', async () => {
		const httpError = new HttpErrorResponse({
			error: { error: 'A user with this email already exists' },
			status: 409,
		})
		usersApiMock.create.mockReturnValue(throwError(() => httpError))
		const { fixture } = await renderAndOpenRaw()

		const firstNameInput = screen.getByRole('textbox', { name: /first name/i })
		const lastNameInput = screen.getByRole('textbox', { name: /last name/i })
		const emailInput = screen.getByRole('textbox', { name: /email/i })

		fireEvent.input(firstNameInput, { target: { value: 'John' } })
		fireEvent.input(lastNameInput, { target: { value: 'Doe' } })
		fireEvent.input(emailInput, { target: { value: 'john@example.com' } })
		fixture.detectChanges()

		fireEvent.click(screen.getByRole('button', { name: /create/i }))
		fixture.detectChanges()

		expect(screen.getByRole('alert')).toBeInTheDocument()
	})

	it('should keep drawer open when creation fails', async () => {
		usersApiMock.create.mockReturnValue(
			throwError(() => new HttpErrorResponse({ error: { error: 'Error' }, status: 409 })),
		)
		const { fixture } = await renderAndOpenRaw()

		const firstNameInput = screen.getByRole('textbox', { name: /first name/i })
		const lastNameInput = screen.getByRole('textbox', { name: /last name/i })
		const emailInput = screen.getByRole('textbox', { name: /email/i })

		fireEvent.input(firstNameInput, { target: { value: 'John' } })
		fireEvent.input(lastNameInput, { target: { value: 'Doe' } })
		fireEvent.input(emailInput, { target: { value: 'john@example.com' } })
		fixture.detectChanges()

		fireEvent.click(screen.getByRole('button', { name: /create/i }))
		fixture.detectChanges()

		expect(screen.getByText('Create User')).toBeInTheDocument()
	})

	it('should show spinner and "Creating..." label during submission', async () => {
		usersApiMock.create.mockReturnValue(
			of({
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				status: 'active',
				statusChangedAt: null,
				statusChangedBy: null,
				deletedAt: null,
				createdAt: null,
				updatedAt: null,
				roles: [],
				passwordEmailSent: true,
			}),
		)
		const { fixture } = await renderAndOpenRaw()

		const firstNameInput = screen.getByRole('textbox', { name: /first name/i })
		const lastNameInput = screen.getByRole('textbox', { name: /last name/i })
		const emailInput = screen.getByRole('textbox', { name: /email/i })

		fireEvent.input(firstNameInput, { target: { value: 'John' } })
		fireEvent.input(lastNameInput, { target: { value: 'Doe' } })
		fireEvent.input(emailInput, { target: { value: 'john@example.com' } })
		fixture.detectChanges()

		fireEvent.click(screen.getByRole('button', { name: /create/i }))
		fixture.detectChanges()
		TestBed.tick()
		fixture.detectChanges()

		expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
	})

	it('should close drawer on successful creation', async () => {
		usersApiMock.create.mockReturnValue(
			of({
				id: 1,
				email: 'john@example.com',
				firstName: 'John',
				lastName: 'Doe',
				status: 'active',
				statusChangedAt: null,
				statusChangedBy: null,
				deletedAt: null,
				createdAt: null,
				updatedAt: null,
				roles: [],
				passwordEmailSent: true,
			}),
		)
		const { fixture } = await renderAndOpenRaw()

		const firstNameInput = screen.getByRole('textbox', { name: /first name/i })
		const lastNameInput = screen.getByRole('textbox', { name: /last name/i })
		const emailInput = screen.getByRole('textbox', { name: /email/i })

		fireEvent.input(firstNameInput, { target: { value: 'John' } })
		fireEvent.input(lastNameInput, { target: { value: 'Doe' } })
		fireEvent.input(emailInput, { target: { value: 'john@example.com' } })
		fixture.detectChanges()

		fireEvent.click(screen.getByRole('button', { name: /create/i }))
		fixture.detectChanges()
		TestBed.tick()
		fixture.detectChanges()

		await advanceTimersByTimeAsync(parseDurationToMs('1s'))
		fixture.detectChanges()

		expect(firstNameInput).toHaveValue('')
	})

	it('should show discard dialog when canceling with dirty form', async () => {
		const { fixture } = await renderAndOpenRaw()

		const firstNameInput = screen.getByRole('textbox', { name: /first name/i })
		fireEvent.input(firstNameInput, { target: { value: 'John' } })
		fixture.detectChanges()

		fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
		fixture.detectChanges()

		expect(screen.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeInTheDocument()
	})
})
