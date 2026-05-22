import { Component, ErrorHandler, forwardRef, model, signal } from '@angular/core'
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
	type FormValueControl,
	type ValidationError,
} from '@angular/forms/signals'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { FormField } from './form-field'
import { FormFieldCustomControl } from './form-field-custom-control'

const TRANSLATIONS: Record<string, string> = {
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.EMAIL': 'Please enter a valid email address',
	'VALIDATION.MIN_LENGTH': 'Must be at least {min} characters',
	'VALIDATION.MAX_LENGTH': 'Must be no more than {max} characters',
	'VALIDATION.MIN': 'Must be at least {min}',
	'VALIDATION.MAX': 'Must be no more than {max}',
	'VALIDATION.PATTERN': 'Invalid format',
}

const mockTranslation = {
	instant: (key: string) => TRANSLATIONS[key] ?? key,
}

@Component({
	selector: 'app-test-host-required-email',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="label()" [hint]="hint()" [showRequired]="showRequired()">
			<input [formField]="emailField" type="email" />
		</app-form-field>
	`,
})
class TestHostRequiredEmail {
	public readonly label = signal('Email')
	public readonly hint = signal<string | undefined>(undefined)
	public readonly showRequired = signal<boolean | undefined>(undefined)

	private readonly model = signal('')
	public readonly emailField: FieldTree<string> = form(
		this.model,
		schema<string>((emailPath) => {
			required(emailPath)
			email(emailPath)
		}),
	)
}

@Component({
	selector: 'app-test-host-min-length',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Password'">
			<input [formField]="passwordField" type="password" />
		</app-form-field>
	`,
})
class TestHostMinLength {
	private readonly model = signal('')
	public readonly passwordField: FieldTree<string> = form(
		this.model,
		schema<string>((passwordPath) => {
			required(passwordPath)
			minLength(passwordPath, 8)
		}),
	)
}

@Component({
	selector: 'app-test-host-max-length',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Bio'">
			<input [formField]="bioField" type="text" />
		</app-form-field>
	`,
})
class TestHostMaxLength {
	public readonly model = signal('')
	public readonly bioField: FieldTree<string> = form(
		this.model,
		schema<string>((bioPath) => {
			maxLength(bioPath, 20)
		}),
	)
}

@Component({
	selector: 'app-test-host-min-max',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Age'">
			<input [formField]="ageField" type="number" />
		</app-form-field>
	`,
})
class TestHostMinMax {
	private readonly model = signal(0)
	public readonly ageField: FieldTree<number> = form(
		this.model,
		schema<number>((agePath) => {
			min(agePath, 18)
			max(agePath, 120)
		}),
	)
}

@Component({
	selector: 'app-test-host-pattern',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Code'">
			<input [formField]="codeField" type="text" />
		</app-form-field>
	`,
})
class TestHostPattern {
	private readonly model = signal('')
	public readonly codeField: FieldTree<string> = form(
		this.model,
		schema<string>((codePath) => {
			pattern(codePath, /^[A-Z]{3}$/)
		}),
	)
}

@Component({
	selector: 'app-test-host-custom-error',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Username'">
			<input [formField]="usernameField" type="text" />
		</app-form-field>
	`,
})
class TestHostCustomError {
	private readonly model = signal('')
	public readonly usernameField: FieldTree<string> = form(
		this.model,
		schema<string>((usernamePath) => {
			validate(usernamePath, (ctx): ValidationError | void => {
				if (ctx.value().includes('admin')) return { kind: 'forbidden', message: 'Username cannot contain "admin"' }
			})
		}),
	)
}

@Component({
	selector: 'app-test-host-custom-error-no-message',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Tag'">
			<input [formField]="tagField" type="text" />
		</app-form-field>
	`,
})
class TestHostCustomErrorNoMessage {
	private readonly model = signal('')
	public readonly tagField: FieldTree<string> = form(
		this.model,
		schema<string>((tagPath) => {
			validate(tagPath, (ctx): ValidationError | void => {
				if (ctx.value().length > 0) return { kind: 'unknownKind' }
			})
		}),
	)
}

@Component({
	selector: 'app-test-host-custom-id',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Email'">
			<input [formField]="emailField" id="custom-email-id" type="email" />
		</app-form-field>
	`,
})
class TestHostCustomId {
	private readonly model = signal('')
	protected readonly emailField: FieldTree<string> = form(
		this.model,
		schema<string>((emailPath) => {
			required(emailPath)
			email(emailPath)
		}),
	)
}

@Component({
	selector: 'app-test-host-multiple-children',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<!-- Intentionally projects multiple children to test runtime validation -->
		<!-- eslint-disable-next-line custom-template/form-field-allowed-content -->
		<app-form-field [label]="'Multi'">
			<input [formField]="field" type="text" />
			<input [formField]="field" type="text" />
		</app-form-field>
	`,
})
class TestHostMultipleChildren {
	private readonly model = signal('')
	protected readonly field: FieldTree<string> = form(this.model)
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
			<!-- eslint-disable-next-line custom-template/form-field-allowed-content -->
			<input type="text" />
		</app-form-field>
	`,
})
class TestHostMissingDirective {}

@Component({
	selector: 'app-fake-custom-control',
	standalone: true,
	providers: [{ provide: FormFieldCustomControl, useExisting: forwardRef(() => FakeCustomControl) }],
	template: `
		<div data-testid="custom-control">Custom control</div>
	`,
})
class FakeCustomControl extends FormFieldCustomControl implements FormValueControl<string> {
	public readonly value = model('')
}

@Component({
	selector: 'app-test-host-date',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Birth date'">
			<input [formField]="dateField" type="date" />
		</app-form-field>
	`,
})
class TestHostDate {
	private readonly model = signal('')
	public readonly dateField: FieldTree<string> = form(
		this.model,
		schema<string>((datePath) => {
			required(datePath)
		}),
	)
}

@Component({
	selector: 'app-test-host-custom-control',
	standalone: true,
	imports: [FormField, SignalFormField, FakeCustomControl],
	template: `
		<app-form-field [label]="'Permissions'">
			<app-fake-custom-control [formField]="field" />
		</app-form-field>
	`,
})
class TestHostCustomControl {
	private readonly model = signal('')
	public readonly field: FieldTree<string> = form(
		this.model,
		schema<string>((fieldPath) => {
			required(fieldPath)
		}),
	)
}

@Component({
	selector: 'app-test-host-checkbox',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Accept terms'" [hint]="hint()" [showRequired]="showRequired()">
			<input [formField]="termsField" type="checkbox" />
		</app-form-field>
	`,
})
class TestHostCheckbox {
	public readonly hint = signal<string | undefined>(undefined)
	public readonly showRequired = signal<boolean | undefined>(undefined)

	private readonly model = signal(false)
	public readonly termsField: FieldTree<boolean> = form(
		this.model,
		schema<boolean>((termsPath) => {
			required(termsPath)
		}),
	)
}

@Component({
	selector: 'app-test-host-label-end-template',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Password'" [labelEndTemplate]="labelEnd">
			<input [formField]="passwordField" type="password" />
		</app-form-field>
		<ng-template #labelEnd>
			<a href="/forgot" data-testid="forgot-link">Forgot password?</a>
		</ng-template>
	`,
})
class TestHostLabelEndTemplate {
	private readonly model = signal('')
	public readonly passwordField: FieldTree<string> = form(
		this.model,
		schema<string>((path) => {
			required(path)
		}),
	)
}

@Component({
	selector: 'app-test-host-no-label-end-template',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		<app-form-field [label]="'Username'">
			<input [formField]="field" type="text" />
		</app-form-field>
	`,
})
class TestHostNoLabelEndTemplate {
	private readonly model = signal('')
	public readonly field: FieldTree<string> = form(this.model)
}

describe('FormField', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	async function renderTestHost(overrides?: Partial<{ label: string; hint: string; showRequired: boolean }>) {
		const { fixture } = await render(TestHostRequiredEmail, {
			providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
		})

		const host = fixture.componentInstance
		if (overrides?.label !== undefined) host.label.set(overrides.label)
		if (overrides?.hint !== undefined) host.hint.set(overrides.hint)
		if (overrides?.showRequired !== undefined) host.showRequired.set(overrides.showRequired)
		fixture.detectChanges()

		return { fixture, host }
	}

	describe('label rendering', () => {
		it('should render label text from label input', async () => {
			await renderTestHost({ label: 'Email address' })

			expect(screen.getByText('Email address')).toBeInTheDocument()
		})

		it('should render the projected input element', async () => {
			await renderTestHost()

			expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		})
	})

	describe('labelEndTemplate', () => {
		it('should render labelEndTemplate content next to the label', async () => {
			await render(TestHostLabelEndTemplate, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			expect(screen.getByTestId('forgot-link')).toBeInTheDocument()
			expect(screen.getByText('Forgot password?')).toBeInTheDocument()
		})

		it('should not render labelEndTemplate area when not provided', async () => {
			await render(TestHostNoLabelEndTemplate, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			expect(screen.queryByTestId('forgot-link')).not.toBeInTheDocument()
		})

		it('should render both label and labelEndTemplate content together', async () => {
			await render(TestHostLabelEndTemplate, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			expect(screen.getByText('Password')).toBeInTheDocument()
			expect(screen.getByTestId('forgot-link')).toBeInTheDocument()
		})
	})

	describe('required indicator', () => {
		it('should show asterisk when showRequired is true', async () => {
			await renderTestHost({ showRequired: true })

			expect(screen.getByText('*')).toBeInTheDocument()
		})

		it('should hide asterisk when showRequired is false', async () => {
			await renderTestHost({ showRequired: false })

			expect(screen.queryByText('*')).not.toBeInTheDocument()
		})

		it('should auto-detect required via REQUIRED metadata', async () => {
			await renderTestHost()

			expect(screen.getByText('*')).toBeInTheDocument()
		})
	})

	describe('hint text', () => {
		it('should show hint text when provided and no errors', async () => {
			await renderTestHost({ hint: 'Enter your work email' })

			expect(screen.getByText('Enter your work email')).toBeInTheDocument()
		})

		it('should hide hint when errors are shown', async () => {
			const { fixture, host } = await renderTestHost({ hint: 'Enter your work email' })

			// Touch the field to trigger error display
			host.emailField().markAsTouched()
			fixture.detectChanges()

			expect(screen.queryByText('Enter your work email')).not.toBeInTheDocument()
		})
	})

	describe('error display', () => {
		it('should not show error when field is untouched even if invalid', async () => {
			await renderTestHost()

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})

		it('should show alert when field is touched and has errors', async () => {
			const { fixture } = await renderTestHost()

			fixture.componentInstance.emailField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toBeInTheDocument()
		})

		it('should map required error to translated message', async () => {
			const { fixture } = await renderTestHost()

			fixture.componentInstance.emailField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
		})

		it('should map email error to translated message', async () => {
			const { fixture } = await renderTestHost()
			const input = screen.getByLabelText(/email/i)
			const user = userEvent.setup()

			await user.type(input, 'notanemail')
			fixture.componentInstance.emailField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address')
		})

		it('should map minLength error with interpolated value', async () => {
			const { fixture } = await render(TestHostMinLength, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			const input = screen.getByLabelText(/password/i)
			const user = userEvent.setup()

			await user.type(input, 'abc')
			fixture.componentInstance.passwordField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Must be at least 8 characters')
		})

		it('should map maxLength error with interpolated value', async () => {
			const { fixture } = await render(TestHostMaxLength, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			// Set model directly — the HTML maxlength attribute prevents typing beyond the limit
			fixture.componentInstance.model.set('This text exceeds the twenty char limit')
			fixture.componentInstance.bioField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Must be no more than 20 characters')
		})

		it('should map min error with interpolated value', async () => {
			const { fixture } = await render(TestHostMinMax, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			fixture.componentInstance.ageField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Must be at least 18')
		})

		it('should map max error with interpolated value', async () => {
			const { fixture } = await render(TestHostMinMax, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			const input = screen.getByLabelText(/age/i)
			const user = userEvent.setup()

			await user.clear(input)
			await user.type(input, '200')
			fixture.componentInstance.ageField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Must be no more than 120')
		})

		it('should map pattern error to translated message', async () => {
			const { fixture } = await render(TestHostPattern, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			const input = screen.getByLabelText(/code/i)
			const user = userEvent.setup()

			await user.type(input, 'abc')
			fixture.componentInstance.codeField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Invalid format')
		})

		it('should display custom validation error message', async () => {
			const { fixture } = await render(TestHostCustomError, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			const input = screen.getByLabelText(/username/i)
			const user = userEvent.setup()

			await user.type(input, 'admin123')
			fixture.componentInstance.usernameField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Username cannot contain "admin"')
		})

		it('should fall back to error kind when custom error has no message', async () => {
			const { fixture } = await render(TestHostCustomErrorNoMessage, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			const input = screen.getByLabelText(/tag/i)
			const user = userEvent.setup()

			await user.type(input, 'x')
			fixture.componentInstance.tagField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('unknownKind')
		})
	})

	describe('id management', () => {
		it('should read custom id from the projected input and set it on the label for attribute', async () => {
			await render(TestHostCustomId, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			const label = screen.getByText(/email/i)
			expect(label).toHaveAttribute('for', 'custom-email-id')
		})

		it('should auto-generate unique id when input has no id', async () => {
			await renderTestHost()

			const label = screen.getByText(/email/i)
			const input = screen.getByLabelText(/email/i)

			const generatedId = input.getAttribute('id') ?? ''
			expect(generatedId).toMatch(/^form-field-[a-f0-9]{8}$/)
			expect(label).toHaveAttribute('for', generatedId)
		})

		it('should match label for attribute with input id when custom id is set', async () => {
			await render(TestHostCustomId, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			const label = screen.getByText(/email/i)
			const input = screen.getByLabelText(/email/i)

			expect(label.getAttribute('for')).toBe('custom-email-id')
			expect(input.getAttribute('id')).toBe('custom-email-id')
		})
	})

	describe('aria-invalid', () => {
		it('should set aria-invalid to true when field has errors and is touched', async () => {
			const { fixture } = await renderTestHost()

			fixture.componentInstance.emailField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
		})

		it('should set aria-invalid to false when field has no errors', async () => {
			await renderTestHost()

			expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'false')
		})
	})

	describe('checkbox layout', () => {
		async function renderCheckbox(overrides?: Partial<{ hint: string; showRequired: boolean }>) {
			const { fixture } = await render(TestHostCheckbox, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			const host = fixture.componentInstance
			if (overrides?.hint !== undefined) host.hint.set(overrides.hint)
			if (overrides?.showRequired !== undefined) host.showRequired.set(overrides.showRequired)
			fixture.detectChanges()

			return { fixture, host }
		}

		it('should render checkbox with label beside it', async () => {
			await renderCheckbox()

			expect(screen.getByRole('checkbox')).toBeInTheDocument()
			expect(screen.getByText('Accept terms')).toBeInTheDocument()
		})

		it('should associate label with checkbox via for/id', async () => {
			await renderCheckbox()

			const checkbox = screen.getByRole('checkbox')
			const label = screen.getByText('Accept terms')

			expect(checkbox.getAttribute('id')).toBeTruthy()
			expect(label.getAttribute('for')).toBe(checkbox.getAttribute('id'))
		})

		it('should apply checkbox layout classes', async () => {
			await renderCheckbox()

			const label = screen.getByText('Accept terms')

			expect(label).toHaveClass('order-2', 'select-none')
		})

		it('should show hint text below checkbox row', async () => {
			await renderCheckbox({ hint: 'You must agree to continue' })

			expect(screen.getByText('You must agree to continue')).toBeInTheDocument()
		})

		it('should hide hint when checkbox has errors', async () => {
			const { fixture } = await renderCheckbox({ hint: 'You must agree to continue' })

			fixture.componentInstance.termsField().markAsTouched()
			fixture.detectChanges()

			expect(screen.queryByText('You must agree to continue')).not.toBeInTheDocument()
			expect(screen.getByRole('alert')).toBeInTheDocument()
		})

		it('should show validation error when checkbox is touched and invalid', async () => {
			const { fixture } = await renderCheckbox()

			fixture.componentInstance.termsField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
		})

		it('should set aria-invalid on the checkbox', async () => {
			const { fixture } = await renderCheckbox()

			fixture.componentInstance.termsField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
		})
	})

	describe('projected content validation', () => {
		it('should throw when multiple direct children are projected', async () => {
			const errors: unknown[] = []
			const errorHandler = { handleError: (e: unknown) => errors.push(e) }

			await render(TestHostMultipleChildren, {
				providers: [
					{ provide: Translation, useValue: mockTranslation },
					{ provide: ErrorHandler, useValue: errorHandler },
					...provideSignalFormsConfig({}),
				],
			})

			expect(
				errors.some((e) => e instanceof Error && e.message.includes('FormField expects a single projected element')),
			).toBe(true)
		})

		it('should error when unsupported element is projected', async () => {
			const errors: unknown[] = []
			const errorHandler = { handleError: (e: unknown) => errors.push(e) }

			await render(TestHostUnsupportedElement, {
				providers: [
					{ provide: Translation, useValue: mockTranslation },
					{ provide: ErrorHandler, useValue: errorHandler },
					...provideSignalFormsConfig({}),
				],
			})

			expect(
				errors.some((e) => e instanceof Error && e.message.includes('FormField received an unsupported element')),
			).toBe(true)
		})

		it('should error when projected form control has no [formField] directive', async () => {
			const errors: unknown[] = []
			const errorHandler = { handleError: (e: unknown) => errors.push(e) }

			await render(TestHostMissingDirective, {
				providers: [
					{ provide: Translation, useValue: mockTranslation },
					{ provide: ErrorHandler, useValue: errorHandler },
					...provideSignalFormsConfig({}),
				],
			})

			expect(
				errors.some((e) => e instanceof Error && e.message.includes('FormField requires a [formField] directive')),
			).toBe(true)
		})
	})

	describe('custom control support', () => {
		it('should render label for custom control', async () => {
			await render(TestHostCustomControl, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			expect(screen.getByText('Permissions')).toBeInTheDocument()
		})

		it('should project custom control content', async () => {
			await render(TestHostCustomControl, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			expect(screen.getByTestId('custom-control')).toBeInTheDocument()
		})

		it('should not report errors for custom control with [formField]', async () => {
			const errors: unknown[] = []
			const errorHandler = { handleError: (e: unknown) => errors.push(e) }

			await render(TestHostCustomControl, {
				providers: [
					{ provide: Translation, useValue: mockTranslation },
					{ provide: ErrorHandler, useValue: errorHandler },
					...provideSignalFormsConfig({}),
				],
			})

			expect(errors).toHaveLength(0)
		})

		it('should show validation error when custom control field is touched and invalid', async () => {
			const { fixture } = await render(TestHostCustomControl, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})

			fixture.componentInstance.field().markAsTouched()
			fixture.detectChanges()
			await fixture.whenStable()

			expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
		})
	})

	describe('date input', () => {
		async function renderDateHost() {
			return render(TestHostDate, {
				providers: [{ provide: Translation, useValue: mockTranslation }, ...provideSignalFormsConfig({})],
			})
		}

		it('should render a date input accessible by label', async () => {
			await renderDateHost()

			const input = screen.getByLabelText(/birth date/i)
			expect(input).toBeInTheDocument()
			expect(input).toHaveAttribute('type', 'date')
		})

		it('should associate label for with input id', async () => {
			await renderDateHost()

			const input = screen.getByLabelText(/birth date/i)
			const label = screen.getByText(/birth date/i)

			expect(input.getAttribute('id')).toBeTruthy()
			expect(label.getAttribute('for')).toBe(input.getAttribute('id'))
		})

		it('should show required asterisk when required validator is present', async () => {
			await renderDateHost()

			expect(screen.getByText('*')).toBeInTheDocument()
		})

		it('should not show error when field is untouched', async () => {
			await renderDateHost()

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})

		it('should show aria-invalid and error alert when touched and empty', async () => {
			const { fixture } = await renderDateHost()

			fixture.componentInstance.dateField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByLabelText(/birth date/i)).toHaveAttribute('aria-invalid', 'true')
			expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
		})
	})

	describe('fallback strings (no Translation provider)', () => {
		// Provide a Translation that mirrors the real service before loadDefaultLanguage() has
		// been called — instant() returns the raw key, which mapErrorToMessage detects and
		// replaces with the English defaults via resolveOrDefault.
		const fallbackProvider = { provide: Translation, useValue: { instant: (key: string) => key } }

		it('should show "This field is required" when translations are not loaded (REQUIRED)', async () => {
			const { fixture } = await render(TestHostRequiredEmail, {
				providers: [fallbackProvider, ...provideSignalFormsConfig({})],
			})

			fixture.componentInstance.emailField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
		})

		it('should show "Please enter a valid email address" when translations are not loaded (EMAIL)', async () => {
			const { fixture } = await render(TestHostRequiredEmail, {
				providers: [fallbackProvider, ...provideSignalFormsConfig({})],
			})

			const input = screen.getByLabelText(/email/i)
			const user = userEvent.setup()

			await user.type(input, 'notanemail')
			fixture.componentInstance.emailField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address')
		})

		it('should show interpolated "Must be at least 8 characters" when translations are not loaded (MIN_LENGTH)', async () => {
			const { fixture } = await render(TestHostMinLength, {
				providers: [fallbackProvider, ...provideSignalFormsConfig({})],
			})

			const input = screen.getByLabelText(/password/i)
			const user = userEvent.setup()

			await user.type(input, 'abc')
			fixture.componentInstance.passwordField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Must be at least 8 characters')
		})

		it('should show interpolated "Must be no more than 20 characters" when translations are not loaded (MAX_LENGTH)', async () => {
			const { fixture } = await render(TestHostMaxLength, {
				providers: [fallbackProvider, ...provideSignalFormsConfig({})],
			})

			fixture.componentInstance.model.set('This text exceeds the twenty char limit')
			fixture.componentInstance.bioField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Must be no more than 20 characters')
		})

		it('should show interpolated "Must be at least 18" when translations are not loaded (MIN)', async () => {
			const { fixture } = await render(TestHostMinMax, {
				providers: [fallbackProvider, ...provideSignalFormsConfig({})],
			})

			fixture.componentInstance.ageField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Must be at least 18')
		})

		it('should show interpolated "Must be no more than 120" when translations are not loaded (MAX)', async () => {
			const { fixture } = await render(TestHostMinMax, {
				providers: [fallbackProvider, ...provideSignalFormsConfig({})],
			})

			const input = screen.getByLabelText(/age/i)
			const user = userEvent.setup()

			await user.clear(input)
			await user.type(input, '200')
			fixture.componentInstance.ageField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Must be no more than 120')
		})

		it('should show "Invalid format" when translations are not loaded (PATTERN)', async () => {
			const { fixture } = await render(TestHostPattern, {
				providers: [fallbackProvider, ...provideSignalFormsConfig({})],
			})

			const input = screen.getByLabelText(/code/i)
			const user = userEvent.setup()

			await user.type(input, 'abc')
			fixture.componentInstance.codeField().markAsTouched()
			fixture.detectChanges()

			expect(screen.getByRole('alert')).toHaveTextContent('Invalid format')
		})
	})
})
