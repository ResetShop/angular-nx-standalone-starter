import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter } from '@angular/router'
import { Translation } from '@providers/i18n/translation'
import { clearAllMocks } from '@test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import ResetPassword from './reset-password'

const TRANSLATIONS: Record<string, string> = {
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.EMAIL': 'Please enter a valid email address',
}

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
}

describe('ResetPassword', () => {
	beforeEach(() => clearAllMocks())

	const defaultProviders = () => [
		provideRouter([]),
		{ provide: Translation, useValue: mockTranslation },
		...provideSignalFormsConfig({}),
	]

	const renderResetPassword = async () => {
		const view = await render(ResetPassword, { providers: defaultProviders() })
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return { ...view, host: view.fixture.componentInstance as any }
	}

	it('should create the reset password component', async () => {
		const { host } = await renderResetPassword()

		expect(host).toBeTruthy()
	})

	it('should render the reset password form with email field', async () => {
		await renderResetPassword()

		expect(screen.getByLabelText(/dirección de email/i)).toBeInTheDocument()
	})

	it('should render submit button with appButton directive', async () => {
		await renderResetPassword()

		const submitButton = screen.getByRole('button', {
			name: /enviar enlace de restablecimiento/i,
		})

		expect(submitButton).toHaveClass('bg-default')
		expect(submitButton).toHaveClass('inline-flex')
		expect(submitButton).toHaveClass('w-full')
	})

	it('should show required error for email when touched and empty', async () => {
		const { fixture, host } = await renderResetPassword()

		host.resetPasswordForm.email().markAsTouched()
		fixture.detectChanges()

		expect(screen.getByText(/this field is required/i)).toBeInTheDocument()
	})

	it('should show invalid email error when email format is incorrect', async () => {
		const user = userEvent.setup()
		const { fixture, host } = await renderResetPassword()

		const emailInput = screen.getByLabelText(/dirección de email/i)
		await user.type(emailInput, 'invalid-email')
		host.resetPasswordForm.email().markAsTouched()
		fixture.detectChanges()

		expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
	})

	it('should enable submit button when form is valid', async () => {
		const user = userEvent.setup()

		await renderResetPassword()

		const emailInput = screen.getByLabelText(/dirección de email/i)
		await user.type(emailInput, 'test@example.com')

		const submitButton = screen.getByRole('button', {
			name: /enviar enlace de restablecimiento/i,
		})
		expect(submitButton).toBeEnabled()
	})

	it('should render back to login link', async () => {
		await renderResetPassword()

		const backToLoginLink = screen.getByText(/volver al inicio de sesión/i)
		expect(backToLoginLink).toBeInTheDocument()
	})

	it('should render "Volver al inicio de sesión" button as a link with variant', async () => {
		await renderResetPassword()

		const backButton = screen.getByRole('link', { name: /volver al inicio de sesión/i })
		expect(backButton).toBeInTheDocument()
		expect(backButton).toHaveAttribute('variant', 'link')
	})

	it('should display the reset password title', async () => {
		await renderResetPassword()

		expect(screen.getByText(/restablecer contraseña/i)).toBeInTheDocument()
	})

	it('should have correct form structure', async () => {
		await renderResetPassword()

		const emailInput = screen.getByLabelText(/dirección de email/i)
		expect(emailInput).toBeInTheDocument()
	})

	it('should not show error messages when form is untouched', async () => {
		await renderResetPassword()

		expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument()
		expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
	})

	it('should clear error when valid email is entered', async () => {
		const user = userEvent.setup()
		const { fixture, host } = await renderResetPassword()

		host.resetPasswordForm.email().markAsTouched()
		fixture.detectChanges()
		expect(screen.getByText(/this field is required/i)).toBeInTheDocument()

		const emailInput = screen.getByLabelText(/dirección de email/i)
		await user.type(emailInput, 'valid@example.com')
		fixture.detectChanges()

		expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument()
		expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
	})
})
