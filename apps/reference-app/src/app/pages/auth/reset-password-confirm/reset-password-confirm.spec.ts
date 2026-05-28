import { HttpErrorResponse, provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router'
import { InMemoryAuthApi, provideAuthMock } from '@providers/auth/auth.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import ResetPasswordConfirm from './reset-password-confirm'

describe('ResetPasswordConfirm', () => {
	beforeEach(() => clearAllMocks())

	const routeWithToken = (token: string | null) => ({
		provide: ActivatedRoute,
		useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } },
	})

	const renderPage = (token: string | null = 'valid-reset-token', api: InMemoryAuthApi = new InMemoryAuthApi()) =>
		render(ResetPasswordConfirm, {
			providers: [
				provideRouter([]),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideAuthMock(api),
				provideTranslationMock(),
				...provideSignalFormsConfig({}),
				routeWithToken(token),
			],
		})

	it('creates the component', async () => {
		const { fixture } = await renderPage()

		expect(fixture.componentInstance).toBeTruthy()
	})

	it('renders the new-password field when the link carries a token', async () => {
		await renderPage('some-token')

		expect(screen.getByLabelText('New password')).toBeInTheDocument()
	})

	it('shows the missing-token message and disables submit when the link has no token', async () => {
		await renderPage(null)

		expect(screen.getByText(/reset link is invalid or incomplete/i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Reset password/i })).toBeDisabled()
		expect(screen.queryByLabelText('New password')).not.toBeInTheDocument()
	})

	it('shows a min-length error when the new password is too short', async () => {
		const user = userEvent.setup()
		await renderPage('some-token')

		await user.type(screen.getByLabelText('New password'), 'short')
		await user.tab()

		expect(screen.getByText(/must be at least/i)).toBeInTheDocument()
	})

	it('keeps submit disabled when the new password is too short', async () => {
		const user = userEvent.setup()
		await renderPage('some-token')

		await user.type(screen.getByLabelText('New password'), 'short')

		expect(screen.getByRole('button', { name: /Reset password/i })).toBeDisabled()
	})

	it('shows the error banner when the reset request fails', async () => {
		const api = new InMemoryAuthApi()
		api.setError(
			'resetPassword',
			new HttpErrorResponse({ status: 400, error: { code: 'RESET_TOKEN_INVALID', message: 'bad' } }),
		)
		const user = userEvent.setup()
		await renderPage('some-token', api)

		await user.type(screen.getByLabelText('New password'), 'a-fresh-secure-password')
		await user.click(screen.getByRole('button', { name: /Reset password/i }))

		expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
	})

	it('falls back to the generic error message on an uncoded server error', async () => {
		const api = new InMemoryAuthApi()
		api.setError('resetPassword', new HttpErrorResponse({ status: 500 }))
		const user = userEvent.setup()
		await renderPage('some-token', api)

		await user.type(screen.getByLabelText('New password'), 'a-fresh-secure-password')
		await user.click(screen.getByRole('button', { name: /Reset password/i }))

		expect(await screen.findByText(/login error/i)).toBeInTheDocument()
	})
})
