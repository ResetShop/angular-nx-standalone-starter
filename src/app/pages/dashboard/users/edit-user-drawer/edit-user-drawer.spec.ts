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
import { EditUserDrawer } from './edit-user-drawer'

const TRANSLATIONS: Record<string, string> = {
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.MAX_LENGTH': 'Maximum {max} characters',
	'VALIDATION.PATTERN': 'Invalid format',
}

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
}

const MOCK_USER = {
	id: 1,
	email: 'john@example.com',
	firstName: 'John',
	lastName: 'Doe',
	status: 'active' as const,
	statusChangedAt: null,
	statusChangedBy: null,
	deletedAt: null,
	createdAt: new Date('2025-01-01'),
	updatedAt: new Date('2025-01-01'),
	roles: [
		{
			id: 1,
			name: 'Admin',
			code: 'admin',
			description: null,
			removable: true,
			createdAt: null,
			updatedAt: null,
		},
	],
}

describe('EditUserDrawer', () => {
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

	async function renderAndOpenRaw(userId = 1) {
		usersApiMock.getById.mockReturnValue(of({ ...MOCK_USER, id: userId }))

		const { fixture } = await render(EditUserDrawer, {
			providers: [
				{ provide: UsersApiService, useValue: usersApiMock },
				{ provide: RolesApiService, useValue: rolesApiMock },
				{ provide: Translation, useValue: mockTranslation },
			],
		})
		TestBed.tick()
		fixture.componentInstance.open(userId)
		TestBed.tick()
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		fixture.detectChanges()
		return { fixture }
	}

	async function renderAndOpen(userId = 1) {
		await renderAndOpenRaw(userId)
	}

	function modifyFirstName(fixture: { detectChanges(): void }, value = 'Jane'): void {
		fireEvent.input(screen.getByDisplayValue('John'), { target: { value } })
		fixture.detectChanges()
	}

	it('should render drawer with edit title', async () => {
		await renderAndOpen()

		expect(screen.getByText('Edit User')).toBeInTheDocument()
	})

	it('should render form fields', async () => {
		await renderAndOpen()

		expect(screen.getByText('First Name')).toBeInTheDocument()
		expect(screen.getByText('Last Name')).toBeInTheDocument()
		expect(screen.getByText('Email')).toBeInTheDocument()
	})

	it('should render save button', async () => {
		await renderAndOpen()

		expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
	})

	it('should render cancel button', async () => {
		await renderAndOpen()

		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
	})

	it('should populate form with existing user data', async () => {
		await renderAndOpen()

		expect(screen.getByDisplayValue('John')).toBeInTheDocument()
		expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
		expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
	})

	it('should call update with correct params on submit', async () => {
		usersApiMock.update.mockReturnValue(of({ ...MOCK_USER, firstName: 'Jane' }))
		const { fixture } = await renderAndOpenRaw()

		modifyFirstName(fixture)

		fireEvent.click(screen.getByRole('button', { name: /save/i }))
		fixture.detectChanges()

		expect(usersApiMock.update.calls).toHaveLength(1)
		expect(usersApiMock.update.calls[0][1]).toEqual(expect.objectContaining({ firstName: 'Jane' }))
	})

	it('should show error alert when update fails', async () => {
		const httpError = new HttpErrorResponse({
			error: { error: 'Email already exists' },
			status: 409,
		})
		usersApiMock.update.mockReturnValue(throwError(() => httpError))
		const { fixture } = await renderAndOpenRaw()

		modifyFirstName(fixture)

		fireEvent.click(screen.getByRole('button', { name: /save/i }))
		fixture.detectChanges()

		expect(screen.getByRole('alert')).toBeInTheDocument()
		expect(screen.getByText('Email already exists')).toBeInTheDocument()
	})

	it('should keep drawer open when update fails', async () => {
		usersApiMock.update.mockReturnValue(
			throwError(() => new HttpErrorResponse({ error: { error: 'Error' }, status: 409 })),
		)
		const { fixture } = await renderAndOpenRaw()

		modifyFirstName(fixture)

		fireEvent.click(screen.getByRole('button', { name: /save/i }))
		fixture.detectChanges()

		expect(screen.getByText('Edit User')).toBeInTheDocument()
	})

	it('should show spinner and "Saving..." label during submission', async () => {
		usersApiMock.update.mockReturnValue(of({ ...MOCK_USER, firstName: 'Jane' }))
		usersApiMock.getById.mockReturnValue(of({ ...MOCK_USER, firstName: 'Jane' }))
		const { fixture } = await renderAndOpenRaw()

		modifyFirstName(fixture)

		fireEvent.click(screen.getByRole('button', { name: /save/i }))
		fixture.detectChanges()
		TestBed.tick()
		fixture.detectChanges()

		expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
	})

	it('should show discard dialog when canceling with dirty form', async () => {
		const { fixture } = await renderAndOpenRaw()

		modifyFirstName(fixture)

		fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
		fixture.detectChanges()

		expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument()
	})

	it('should close drawer on successful update', async () => {
		usersApiMock.update.mockReturnValue(of({ ...MOCK_USER, firstName: 'Jane' }))
		usersApiMock.getById.mockReturnValue(of({ ...MOCK_USER, firstName: 'Jane' }))
		const { fixture } = await renderAndOpenRaw()
		const firstNameInput = screen.getByDisplayValue('John')

		modifyFirstName(fixture)

		fireEvent.click(screen.getByRole('button', { name: /save/i }))
		fixture.detectChanges()
		TestBed.tick()
		fixture.detectChanges()

		await advanceTimersByTimeAsync(parseDurationToMs('1s'))
		fixture.detectChanges()

		expect(firstNameInput).toHaveValue('')
	})
})
