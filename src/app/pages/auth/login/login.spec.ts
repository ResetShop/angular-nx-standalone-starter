import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter } from '@angular/router';
import Login from './login';

describe('Login', () => {
	it('should create the login component', async () => {
		const { fixture } = await render(Login, {
			providers: [provideRouter([])],
		});

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should render the login form with email and password fields', async () => {
		await render(Login, {
			providers: [provideRouter([])],
		});

		expect(screen.getByLabelText(/dirección de email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
	});

	it('should render submit button with appButton directive', async () => {
		await render(Login, {
			providers: [provideRouter([])],
		});

		const submitButton = screen.getByRole('button', {
			name: /iniciar sesión/i,
		});

		// Check that the button has the appButton directive classes
		expect(submitButton).toHaveClass('bg-primary');
		expect(submitButton).toHaveClass('inline-flex');
		expect(submitButton).toHaveClass('w-full');
	});

	it('should show required error for email when dirty and empty', async () => {
		const user = userEvent.setup();

		await render(Login, {
			providers: [provideRouter([])],
		});

		const emailInput = screen.getByLabelText(/dirección de email/i);
		await user.type(emailInput, 'a');
		await user.clear(emailInput);

		expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
	});

	it('should show invalid email error when email format is incorrect and dirty', async () => {
		const user = userEvent.setup();

		await render(Login, {
			providers: [provideRouter([])],
		});

		const emailInput = screen.getByLabelText(/dirección de email/i);
		await user.type(emailInput, 'invalid-email');

		expect(screen.getByText(/ingrese un email válido/i)).toBeInTheDocument();
	});

	it('should show required error for password when dirty and empty', async () => {
		const user = userEvent.setup();

		await render(Login, {
			providers: [provideRouter([])],
		});

		const passwordInput = screen.getByLabelText(/contraseña/i);
		await user.type(passwordInput, 'a');
		await user.clear(passwordInput);

		expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
	});

	it('should show minlength error when password is too short and dirty', async () => {
		const user = userEvent.setup();

		await render(Login, {
			providers: [provideRouter([])],
		});

		const passwordInput = screen.getByLabelText(/contraseña/i);
		await user.type(passwordInput, '1234567');
		await user.tab();

		expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
	});

	it('should enable submit button when form is valid', async () => {
		const user = userEvent.setup();

		await render(Login, {
			providers: [provideRouter([])],
		});

		const emailInput = screen.getByLabelText(/dirección de email/i);
		const passwordInput = screen.getByLabelText(/contraseña/i);

		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'password123');

		const submitButton = screen.getByRole('button', {
			name: /iniciar sesión/i,
		});
		expect(submitButton).toBeEnabled();
	});

	it('should render forgot password link', async () => {
		await render(Login, {
			providers: [provideRouter([])],
		});

		const forgotPasswordLink = screen.getByText(/¿olvidaste tu contraseña?/i);
		expect(forgotPasswordLink).toBeInTheDocument();
	});

	it('should have correct form structure with formGroup directive', async () => {
		await render(Login, {
			providers: [provideRouter([])],
		});

		// Verify form inputs exist using semantic queries
		const emailInput = screen.getByLabelText(/dirección de email/i);
		const passwordInput = screen.getByLabelText(/contraseña/i);

		expect(emailInput).toBeInTheDocument();
		expect(passwordInput).toBeInTheDocument();
	});

	it('should not show email error when form is pristine', async () => {
		await render(Login, {
			providers: [provideRouter([])],
		});

		expect(screen.queryByText(/el email es requerido/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/ingrese un email válido/i)).not.toBeInTheDocument();
	});

	it('should not show password error when form is untouched', async () => {
		await render(Login, {
			providers: [provideRouter([])],
		});

		expect(screen.queryByText(/la contraseña es requerida/i)).not.toBeInTheDocument();
	});
});
