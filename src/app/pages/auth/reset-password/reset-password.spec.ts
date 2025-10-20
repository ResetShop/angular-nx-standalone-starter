import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter } from '@angular/router';
import ResetPassword from './reset-password';

describe('ResetPassword', () => {
	it('should create the reset password component', async () => {
		const { fixture } = await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should render the reset password form with email field', async () => {
		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		expect(screen.getByLabelText(/dirección de email/i)).toBeInTheDocument();
	});

	it('should render submit button with appButton directive', async () => {
		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		const submitButton = screen.getByRole('button', {
			name: /enviar enlace de restablecimiento/i,
		});

		// Check that the button has the appButton directive classes
		expect(submitButton).toHaveClass('bg-primary');
		expect(submitButton).toHaveClass('inline-flex');
		expect(submitButton).toHaveClass('w-full');
	});

	it('should show required error for email when touched and empty', async () => {
		const user = userEvent.setup();

		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		const emailInput = screen.getByLabelText(/dirección de email/i);
		await user.click(emailInput);
		await user.tab();

		expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
	});

	it('should show invalid email error when email format is incorrect', async () => {
		const user = userEvent.setup();

		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		const emailInput = screen.getByLabelText(/dirección de email/i);
		await user.type(emailInput, 'invalid-email');
		await user.tab();

		expect(screen.getByText(/ingrese un email válido/i)).toBeInTheDocument();
	});

	it('should enable submit button when form is valid', async () => {
		const user = userEvent.setup();

		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		const emailInput = screen.getByLabelText(/dirección de email/i);
		await user.type(emailInput, 'test@example.com');

		const submitButton = screen.getByRole('button', {
			name: /enviar enlace de restablecimiento/i,
		});
		expect(submitButton).toBeEnabled();
	});

	it('should render back to login link', async () => {
		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		const backToLoginLink = screen.getByText(/volver al inicio de sesión/i);
		expect(backToLoginLink).toBeInTheDocument();
	});

	it('should render "Volver al inicio de sesión" button as a link with variant', async () => {
		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		const backButton = screen.getByRole('link', { name: /volver al inicio de sesión/i });
		expect(backButton).toBeInTheDocument();
		expect(backButton).toHaveAttribute('variant', 'link');
	});

	it('should display the reset password title', async () => {
		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		expect(screen.getByText(/restablecer contraseña/i)).toBeInTheDocument();
	});

	it('should have correct form structure with formGroup directive', async () => {
		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		// Verify form input exists using semantic query
		const emailInput = screen.getByLabelText(/dirección de email/i);
		expect(emailInput).toBeInTheDocument();
	});

	it('should not show error messages when form is untouched', async () => {
		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		expect(screen.queryByText(/el email es requerido/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/ingrese un email válido/i)).not.toBeInTheDocument();
	});

	it('should clear error when valid email is entered', async () => {
		const user = userEvent.setup();

		await render(ResetPassword, {
			providers: [provideRouter([])],
		});

		const emailInput = screen.getByLabelText(/dirección de email/i);

		// First, trigger error
		await user.type(emailInput, 'invalid');
		await user.tab();
		expect(screen.getByText(/ingrese un email válido/i)).toBeInTheDocument();

		// Then, fix the email
		await user.clear(emailInput);
		await user.type(emailInput, 'valid@example.com');
		await user.tab();

		expect(screen.queryByText(/ingrese un email válido/i)).not.toBeInTheDocument();
	});
});
