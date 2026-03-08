import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { provideRouter } from '@angular/router';
import { Translation } from '@providers/i18n/translation';
import { clearAllMocks } from '@test-utils';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import Login from './login';

const TRANSLATIONS: Record<string, string> = {
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.EMAIL': 'Please enter a valid email address',
	'VALIDATION.MIN_LENGTH': 'Must be at least {min} characters',
};

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
};

describe('Login', () => {
	beforeEach(() => clearAllMocks());

	const defaultProviders = () => [
		provideRouter([]),
		provideHttpClient(),
		provideHttpClientTesting(),
		{ provide: Translation, useValue: mockTranslation },
		...provideSignalFormsConfig({}),
	];

	const renderLogin = async () => {
		const view = await render(Login, { providers: defaultProviders() });
		return { ...view, host: view.fixture.componentInstance };
	};

	it('should create the login component', async () => {
		const { host } = await renderLogin();

		expect(host).toBeTruthy();
	});

	it('should render the login form with email and password fields', async () => {
		await renderLogin();

		expect(screen.getByLabelText(/dirección de email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
	});

	it('should render submit button with appButton directive', async () => {
		await renderLogin();

		const submitButton = screen.getByRole('button', {
			name: /iniciar sesión/i,
		});

		expect(submitButton).toHaveClass('bg-default');
		expect(submitButton).toHaveClass('inline-flex');
		expect(submitButton).toHaveClass('w-full');
	});

	it('should show required error for email when touched and empty', async () => {
		const { fixture, host } = await renderLogin();

		host.loginForm.email().markAsTouched();
		fixture.detectChanges();

		expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
	});

	it('should show invalid email error when email format is incorrect', async () => {
		const user = userEvent.setup();
		const { fixture, host } = await renderLogin();

		const emailInput = screen.getByLabelText(/dirección de email/i);
		await user.type(emailInput, 'invalid-email');
		host.loginForm.email().markAsTouched();
		fixture.detectChanges();

		expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
	});

	it('should show required error for password when touched and empty', async () => {
		const { fixture, host } = await renderLogin();

		host.loginForm.password().markAsTouched();
		fixture.detectChanges();

		expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
	});

	it('should show minlength error when password is too short', async () => {
		const user = userEvent.setup();
		const { fixture, host } = await renderLogin();

		const passwordInput = screen.getByLabelText(/contraseña/i);
		await user.type(passwordInput, '1234567');
		host.loginForm.password().markAsTouched();
		fixture.detectChanges();

		expect(screen.getByText(/must be at least/i)).toBeInTheDocument();
	});

	it('should enable submit button when form is valid', async () => {
		const user = userEvent.setup();

		await renderLogin();

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
		await renderLogin();

		const forgotPasswordLink = screen.getByText(/¿olvidaste tu contraseña?/i);
		expect(forgotPasswordLink).toBeInTheDocument();
	});

	it('should have correct form structure', async () => {
		await renderLogin();

		const emailInput = screen.getByLabelText(/dirección de email/i);
		const passwordInput = screen.getByLabelText(/contraseña/i);

		expect(emailInput).toBeInTheDocument();
		expect(passwordInput).toBeInTheDocument();
	});

	it('should not show email error when form is pristine', async () => {
		await renderLogin();

		expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
	});

	it('should not show password error when form is untouched', async () => {
		await renderLogin();

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
