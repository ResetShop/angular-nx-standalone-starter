import { Component, ErrorHandler, signal } from '@angular/core';
import {
	email,
	form,
	max,
	maxLength,
	min,
	minLength,
	pattern,
	provideSignalFormsConfig,
	required,
	schema,
	FormField as SignalFormField,
	validate,
	type FieldTree,
	type ValidationError,
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
		<app-form-field [label]="'Password'" #ff="formField">
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

@Component({
	selector: 'app-test-host-max-length',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Bio'" #ff="formField">
			<input [id]="ff.resolvedId()" [formField]="bioField" type="text" />
		</app-form-field>
	`,
})
class TestHostMaxLength {
	readonly model = signal('');
	readonly bioField: FieldTree<string> = form(
		this.model,
		schema<string>((bioPath) => {
			maxLength(bioPath, 20);
		}),
	);
}

@Component({
	selector: 'app-test-host-min-max',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Age'" #ff="formField">
			<input [id]="ff.resolvedId()" [formField]="ageField" type="number" />
		</app-form-field>
	`,
})
class TestHostMinMax {
	private readonly model = signal(0);
	readonly ageField: FieldTree<number> = form(
		this.model,
		schema<number>((agePath) => {
			min(agePath, 18);
			max(agePath, 120);
		}),
	);
}

@Component({
	selector: 'app-test-host-pattern',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Code'" #ff="formField">
			<input [id]="ff.resolvedId()" [formField]="codeField" type="text" />
		</app-form-field>
	`,
})
class TestHostPattern {
	private readonly model = signal('');
	readonly codeField: FieldTree<string> = form(
		this.model,
		schema<string>((codePath) => {
			pattern(codePath, /^[A-Z]{3}$/);
		}),
	);
}

@Component({
	selector: 'app-test-host-custom-error',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Username'" #ff="formField">
			<input [id]="ff.resolvedId()" [formField]="usernameField" type="text" />
		</app-form-field>
	`,
})
class TestHostCustomError {
	private readonly model = signal('');
	readonly usernameField: FieldTree<string> = form(
		this.model,
		schema<string>((usernamePath) => {
			validate(usernamePath, (ctx): ValidationError | void => {
				if (ctx.value().includes('admin')) return { kind: 'forbidden', message: 'Username cannot contain "admin"' };
			});
		}),
	);
}

@Component({
	selector: 'app-test-host-custom-error-no-message',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Tag'" #ff="formField">
			<input [id]="ff.resolvedId()" [formField]="tagField" type="text" />
		</app-form-field>
	`,
})
class TestHostCustomErrorNoMessage {
	private readonly model = signal('');
	readonly tagField: FieldTree<string> = form(
		this.model,
		schema<string>((tagPath) => {
			validate(tagPath, (ctx): ValidationError | void => {
				if (ctx.value().length > 0) return { kind: 'unknownKind' };
			});
		}),
	);
}

@Component({
	selector: 'app-test-host-multiple-children',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<!-- Intentionally projects multiple children to test runtime validation -->
		<!-- eslint-disable-next-line custom-template/form-field-allowed-content -->
		<app-form-field [label]="'Multi'" #ff="formField">
			<input [id]="ff.resolvedId()" [formField]="field" type="text" />
			<input [formField]="field" type="text" />
		</app-form-field>
	`,
})
class TestHostMultipleChildren {
	private readonly model = signal('');
	readonly field: FieldTree<string> = form(this.model);
}

@Component({
	selector: 'app-test-host-unsupported-element',
	standalone: true,
	imports: [FormField],
	template: `
		<!-- Intentionally projects an unsupported element to test runtime validation -->
		<app-form-field [label]="'Bad'">
			<!-- eslint-disable-next-line custom-template/form-field-allowed-content -->
			<span>Not a form control</span>
		</app-form-field>
	`,
})
class TestHostUnsupportedElement {}

@Component({
	selector: 'app-test-host-missing-directive',
	standalone: true,
	imports: [FormField],
	template: `
		<!-- Intentionally omits [formField] directive to test runtime validation -->
		<app-form-field [label]="'No Directive'">
			<input type="text" />
		</app-form-field>
	`,
})
class TestHostMissingDirective {}

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

		it('should map maxLength error with interpolated value', async () => {
			const { fixture } = await render(TestHostMaxLength, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			});

			// Set model directly — the HTML maxlength attribute prevents typing beyond the limit
			fixture.componentInstance.model.set('This text exceeds the twenty char limit');
			fixture.componentInstance.bioField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toHaveTextContent('Must be no more than 20 characters');
		});

		it('should map min error with interpolated value', async () => {
			const { fixture } = await render(TestHostMinMax, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			});

			fixture.componentInstance.ageField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toHaveTextContent('Must be at least 18');
		});

		it('should map max error with interpolated value', async () => {
			const { fixture } = await render(TestHostMinMax, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			});

			const input = screen.getByLabelText(/age/i);
			const user = userEvent.setup();

			await user.clear(input);
			await user.type(input, '200');
			fixture.componentInstance.ageField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toHaveTextContent('Must be no more than 120');
		});

		it('should map pattern error to translated message', async () => {
			const { fixture } = await render(TestHostPattern, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			});

			const input = screen.getByLabelText(/code/i);
			const user = userEvent.setup();

			await user.type(input, 'abc');
			fixture.componentInstance.codeField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toHaveTextContent('Invalid format');
		});

		it('should display custom validation error message', async () => {
			const { fixture } = await render(TestHostCustomError, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			});

			const input = screen.getByLabelText(/username/i);
			const user = userEvent.setup();

			await user.type(input, 'admin123');
			fixture.componentInstance.usernameField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toHaveTextContent('Username cannot contain "admin"');
		});

		it('should fall back to error kind when custom error has no message', async () => {
			const { fixture } = await render(TestHostCustomErrorNoMessage, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			});

			const input = screen.getByLabelText(/tag/i);
			const user = userEvent.setup();

			await user.type(input, 'x');
			fixture.componentInstance.tagField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByRole('alert')).toHaveTextContent('unknownKind');
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

	describe('aria-invalid', () => {
		it('should set aria-invalid to true when field has errors and is touched', async () => {
			const { fixture } = await renderTestHost();

			fixture.componentInstance.emailField().markAsTouched();
			fixture.detectChanges();

			expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
		});

		it('should set aria-invalid to false when field has no errors', async () => {
			await renderTestHost();

			expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'false');
		});
	});

	describe('projected content validation', () => {
		it('should throw when multiple direct children are projected', async () => {
			const errors: unknown[] = [];
			const errorHandler = { handleError: (e: unknown) => errors.push(e) };

			await render(TestHostMultipleChildren, {
				providers: [
					{ provide: Translation, useValue: mockTranslation },
					{ provide: ErrorHandler, useValue: errorHandler },
					...provideSignalFormsConfig({}),
				],
			});

			expect(
				errors.some((e) => e instanceof Error && e.message.includes('FormField expects a single projected element')),
			).toBe(true);
		});

		it('should silently drop unsupported elements via ng-content select', async () => {
			await render(TestHostUnsupportedElement, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			});

			expect(screen.queryByText('Not a form control')).not.toBeInTheDocument();
		});

		it('should error when projected form control has no [formField] directive', async () => {
			const errors: unknown[] = [];
			const errorHandler = { handleError: (e: unknown) => errors.push(e) };

			await render(TestHostMissingDirective, {
				providers: [
					{ provide: Translation, useValue: mockTranslation },
					{ provide: ErrorHandler, useValue: errorHandler },
					...provideSignalFormsConfig({}),
				],
			});

			expect(
				errors.some((e) => e instanceof Error && e.message.includes('FormField requires a [formField] directive')),
			).toBe(true);
		});
	});
});
