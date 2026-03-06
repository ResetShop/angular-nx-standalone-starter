import { Component, signal } from '@angular/core';
import {
	email,
	form,
	minLength,
	provideSignalFormsConfig,
	required,
	schema,
	FormField as SignalFormField,
	type FieldTree,
} from '@angular/forms/signals';
import { Translation } from '@providers/i18n/translation';
import { clearAllMocks } from '@test-utils';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FormField } from './form-field';

const TRANSLATIONS: Record<string, string> = {
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.EMAIL': 'Please enter a valid email address',
	'VALIDATION.MIN_LENGTH': 'Must be at least {min} characters',
	'VALIDATION.MAX_LENGTH': 'Must be no more than {max} characters',
	'VALIDATION.MIN': 'Must be at least {min}',
	'VALIDATION.MAX': 'Must be no more than {max}',
	'VALIDATION.PATTERN': 'Invalid format',
};

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
};

@Component({
	selector: 'app-test-host-required-email',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field
			[label]="label()"
			[field]="emailField"
			[hint]="hint()"
			[fieldId]="fieldId()"
			[showRequired]="showRequired()"
			#ff="formField"
		>
			<input [id]="ff.resolvedId()" [formField]="emailField" type="email" />
		</app-form-field>
	`,
})
class TestHostRequiredEmail {
	readonly label = signal('Email');
	readonly hint = signal<string | undefined>(undefined);
	readonly fieldId = signal<string | undefined>(undefined);
	readonly showRequired = signal<boolean | undefined>(undefined);

	private readonly model = signal('');
	readonly emailField: FieldTree<string> = form(
		this.model,
		schema<string>((emailPath) => {
			required(emailPath);
			email(emailPath);
		}),
	);
}

@Component({
	selector: 'app-test-host-min-length',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Password'" [field]="passwordField" #ff="formField">
			<input [id]="ff.resolvedId()" [formField]="passwordField" type="password" />
		</app-form-field>
	`,
})
class TestHostMinLength {
	private readonly model = signal('');
	readonly passwordField: FieldTree<string> = form(
		this.model,
		schema<string>((passwordPath) => {
			required(passwordPath);
			minLength(passwordPath, 8);
		}),
	);
}

describe('FormField', () => {
	beforeEach(() => {
		clearAllMocks();
	});

	async function renderTestHost(
		overrides?: Partial<{ label: string; hint: string; fieldId: string; showRequired: boolean }>,
	) {
		const { fixture } = await render(TestHostRequiredEmail, {
			providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
		});

		const host = fixture.componentInstance;
		if (overrides?.label !== undefined) host.label.set(overrides.label);
		if (overrides?.hint !== undefined) host.hint.set(overrides.hint);
		if (overrides?.fieldId !== undefined) host.fieldId.set(overrides.fieldId);
		if (overrides?.showRequired !== undefined) host.showRequired.set(overrides.showRequired);
		fixture.detectChanges();

		return { fixture, host };
	}

	describe('label rendering', () => {
		it('should render label text from label input', async () => {
			await renderTestHost({ label: 'Email address' });

			expect(screen.getByText('Email address')).toBeInTheDocument();
		});

		it('should render the projected input element', async () => {
			await renderTestHost();

			expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		});
	});

	describe('required indicator', () => {
		it('should show asterisk when showRequired is true', async () => {
			await renderTestHost({ showRequired: true });

			expect(screen.getByText('*')).toBeInTheDocument();
		});

		it('should hide asterisk when showRequired is false', async () => {
			await renderTestHost({ showRequired: false });

			expect(screen.queryByText('*')).not.toBeInTheDocument();
		});

		it('should auto-detect required via REQUIRED metadata', async () => {
			await renderTestHost();

			expect(screen.getByText('*')).toBeInTheDocument();
		});
	});

	describe('hint text', () => {
		it('should show hint text when provided and no errors', async () => {
			await renderTestHost({ hint: 'Enter your work email' });

			expect(screen.getByText('Enter your work email')).toBeInTheDocument();
		});

		it('should hide hint when errors are shown', async () => {
			const { fixture, host } = await renderTestHost({ hint: 'Enter your work email' });

			// Touch the field to trigger error display
			host.emailField().markAsTouched();
			fixture.detectChanges();

			expect(screen.queryByText('Enter your work email')).not.toBeInTheDocument();
		});
	});

	describe('error display', () => {
		it('should not show error when field is untouched even if invalid', async () => {
			await renderTestHost();

			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});

		it('should show alert when field is touched and has errors', async () => {
			const { fixture } = await renderTestHost();

			fixture.componentInstance.emailField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toBeInTheDocument();
		});

		it('should map required error to translated message', async () => {
			const { fixture } = await renderTestHost();

			fixture.componentInstance.emailField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
		});

		it('should map email error to translated message', async () => {
			const { fixture } = await renderTestHost();
			const input = screen.getByLabelText(/email/i);
			const user = userEvent.setup();

			await user.type(input, 'notanemail');
			fixture.componentInstance.emailField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
		});

		it('should map minLength error with interpolated value', async () => {
			const { fixture } = await render(TestHostMinLength, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			});

			const input = screen.getByLabelText(/password/i);
			const user = userEvent.setup();

			await user.type(input, 'abc');
			fixture.componentInstance.passwordField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toHaveTextContent('Must be at least 8 characters');
		});
	});

	describe('id management', () => {
		it('should use custom fieldId on the label for attribute', async () => {
			await renderTestHost({ fieldId: 'custom-email-id' });

			const label = screen.getByText(/email/i);
			expect(label).toHaveAttribute('for', 'custom-email-id');
		});

		it('should auto-generate unique id when fieldId not provided', async () => {
			await renderTestHost();

			const label = screen.getByText(/email/i);
			expect(label.getAttribute('for') ?? '').toMatch(/^form-field-[a-f0-9]{8}$/);
		});

		it('should match label for attribute with input id', async () => {
			await renderTestHost({ fieldId: 'my-field' });

			const label = screen.getByText(/email/i);
			const input = screen.getByLabelText(/email/i);

			expect(label.getAttribute('for')).toBe('my-field');
			expect(input.getAttribute('id')).toBe('my-field');
		});
	});
});
