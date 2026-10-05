import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter } from '@angular/router'
import { Permission } from '@contracts/permission/legacy-permission.constants'
import { provideSliceTranslationMock, setLanguageMock } from '@mocks/slice-translation.mock'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import {
	advanceTimersByTime,
	advanceTimersByTimeAsync,
	clearAllMocks,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import SettingsHome from './settings-home'

describe('SettingsHome', () => {
	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
	})

	afterEach(() => {
		useRealTimers()
	})

	async function renderPage(permissions: readonly string[]) {
		const view = await render(SettingsHome, {
			providers: [
				provideRouter([]),
				provideAuthMock(),
				provideSliceTranslationMock(settingsEn),
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(
			createMockUser({ hasPermission: (identifier: string) => permissions.includes(identifier) }),
		)
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	it('should render the page title and description', async () => {
		await renderPage([])

		expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
		expect(screen.getByText('Configure your application preferences.')).toBeInTheDocument()
	})

	it('should offer only the branch selection to a user without management permissions', async () => {
		await renderPage([])

		expect(screen.getByRole('link', { name: /^Branches/ })).toHaveAttribute(
			'href',
			'/dashboard/settings/office-branches',
		)
		expect(screen.queryByRole('link', { name: /^User management/ })).not.toBeInTheDocument()
		expect(screen.queryByRole('link', { name: /^Cash concepts/ })).not.toBeInTheDocument()
	})

	it('should offer user management to users allowed to manage users', async () => {
		await renderPage([Permission.SETTINGS_USERS_MANAGE])

		expect(screen.getByRole('link', { name: /^User management/ })).toHaveAttribute(
			'href',
			'/dashboard/settings/user-management',
		)
		expect(screen.queryByRole('link', { name: /^Cash concepts/ })).not.toBeInTheDocument()
	})

	it('should offer cash concepts to users allowed to manage them', async () => {
		await renderPage([Permission.SETTINGS_CASH_CONCEPTS_MANAGE])

		expect(screen.getByRole('link', { name: /^Cash concepts/ })).toHaveAttribute('href', '/dashboard/settings/concepts')
		expect(screen.queryByRole('link', { name: /^User management/ })).not.toBeInTheDocument()
	})

	it('should offer every section to a user with every permission', async () => {
		await renderPage([Permission.SETTINGS_USERS_MANAGE, Permission.SETTINGS_CASH_CONCEPTS_MANAGE])

		expect(screen.getAllByRole('link')).toHaveLength(3)
	})

	it('should show the current language in the language selector', async () => {
		await renderPage([])

		expect(screen.getByRole('combobox')).toHaveTextContent('English')
	})

	it('should switch the language when another one is chosen', async () => {
		const view = await renderPage([])
		const user = userEvent.setup({ advanceTimers: (ms) => advanceTimersByTime(ms) })

		await user.click(screen.getByRole('combobox'))
		await user.click(screen.getByText('Spanish'))
		TestBed.tick()
		view.fixture.detectChanges()

		expect(setLanguageMock.calls).toEqual([['es']])
	})
})
