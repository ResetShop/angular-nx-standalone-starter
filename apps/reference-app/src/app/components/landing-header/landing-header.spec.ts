import { provideRouter } from '@angular/router'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { provideMockTheme } from '@resetshop/angular-core/theme/theme.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { provideAuthStateMock } from '@store/auth/auth.store.mock'
import { render, screen } from '@testing-library/angular'
import { LandingHeader } from './landing-header'

describe('LandingHeader', () => {
	beforeEach(() => clearAllMocks())

	const renderHeader = (isAuthenticated: boolean) =>
		render(LandingHeader, {
			providers: [
				provideRouter([]),
				provideTranslationMock(),
				provideMockTheme(false),
				provideAuthStateMock(isAuthenticated),
			],
		})

	it('renders a banner landmark', async () => {
		await renderHeader(false)

		expect(screen.getByRole('banner')).toBeInTheDocument()
	})

	it('renders the login link pointing to the auth page', async () => {
		await renderHeader(false)

		expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login')
	})

	it('renders the theme toggle', async () => {
		await renderHeader(false)

		expect(screen.getByRole('button', { name: /switch to (light|dark) mode/i })).toBeInTheDocument()
	})

	it('does not render the dashboard link when the visitor is unauthenticated', async () => {
		await renderHeader(false)

		expect(screen.queryByRole('link', { name: /go to dashboard/i })).not.toBeInTheDocument()
	})

	it('renders the dashboard link pointing to the dashboard when authenticated', async () => {
		await renderHeader(true)

		expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/dashboard')
	})
})
