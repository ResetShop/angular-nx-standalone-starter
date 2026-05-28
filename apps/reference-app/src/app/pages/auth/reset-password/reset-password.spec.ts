import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter } from '@angular/router'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import ResetPassword from './reset-password'

describe('ResetPassword', () => {
	beforeEach(() => clearAllMocks())

	const defaultProviders = () => [
		provideRouter([]),
		provideHttpClient(),
		provideHttpClientTesting(),
		provideAuthMock(),
		provideTranslationMock(),
		...provideSignalFormsConfig({}),
	]

	const renderResetPassword = () => render(ResetPassword, { providers: defaultProviders() })

	it('should create the reset password component', async () => {
		const { fixture } = await renderResetPassword()

		expect(fixture.componentInstance).toBeTruthy()
	})

	it('should render the reset password form with email field', async () => {
		await renderResetPassword()

		expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument()
	})

	it('should render submit button with appButton directive', async () => {
		await renderResetPassword()

		const submitButton = screen.getByRole('button', { name: /Send reset link/i })

		expect(submitButton).toHaveClass('bg-default')
		expect(submitButton).toHaveClass('inline-flex')
		expect(submitButton).toHaveClass('w-full')
	})

	it('should keep submit button disabled when form is empty', async () => {
		await renderResetPassword()

		expect(screen.getByRole('button', { name: /Send reset link/i })).toBeDisabled()
	})

	it('should show required error for email when focused and blurred empty', async () => {
		const user = userEvent.setup()
		await renderResetPassword()

		const emailInput = screen.getByLabelText(/Email address/i)
		await user.click(emailInput)
		await user.tab()

		expect(screen.getByText(/this field is required/i)).toBeInTheDocument()
	})

	it('should show invalid email error when email format is incorrect', async () => {
		const user = userEvent.setup()
		await renderResetPassword()

		const emailInput = screen.getByLabelText(/Email address/i)
		await user.type(emailInput, 'invalid-email')
		await user.tab()

		expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
	})

	it('should enable submit button when form is valid', async () => {
		const user = userEvent.setup()

		await renderResetPassword()

		const emailInput = screen.getByLabelText(/Email address/i)
		await user.type(emailInput, 'test@example.com')

		const submitButton = screen.getByRole('button', { name: /Send reset link/i })
		expect(submitButton).toBeEnabled()
	})

	it('should render back to login link', async () => {
		await renderResetPassword()

		const backToLoginLink = screen.getByText(/Back to sign in/i)
		expect(backToLoginLink).toBeInTheDocument()
	})

	it('should render "Back to sign in" as a navigable link', async () => {
		await renderResetPassword()

		const backButton = screen.getByRole('link', { name: /Back to sign in/i })
		expect(backButton).toBeInTheDocument()
	})

	it('should display the reset password title', async () => {
		await renderResetPassword()

		expect(screen.getByText(/Reset password/i)).toBeInTheDocument()
	})

	it('should have correct form structure', async () => {
		await renderResetPassword()

		const emailInput = screen.getByLabelText(/Email address/i)
		expect(emailInput).toBeInTheDocument()
	})

	it('should not show error messages when form is untouched', async () => {
		await renderResetPassword()

		expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument()
		expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
	})

	it('shows the neutral confirmation after submitting a valid email', async () => {
		const user = userEvent.setup()
		await renderResetPassword()

		await user.type(screen.getByLabelText(/Email address/i), 'test@example.com')
		await user.click(screen.getByRole('button', { name: /Send reset link/i }))

		expect(await screen.findByText(/a password-reset link has been sent/i)).toBeInTheDocument()
		// The email field is replaced by the confirmation (no enumeration of whether the account exists).
		expect(screen.queryByLabelText(/Email address/i)).not.toBeInTheDocument()
	})

	it('should clear error when valid email is entered after blur', async () => {
		const user = userEvent.setup()
		await renderResetPassword()

		const emailInput = screen.getByLabelText(/Email address/i)
		await user.click(emailInput)
		await user.tab()
		expect(screen.getByText(/this field is required/i)).toBeInTheDocument()

		await user.click(emailInput)
		await user.type(emailInput, 'valid@example.com')

		expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument()
		expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
	})
})
