import { Component, computed, effect, inject, input, signal } from '@angular/core';
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
import { Translation, type Language } from '@providers/i18n/translation';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { FormField } from './form-field';

// --- Story wrapper components ---

type InputType = 'email' | 'text' | 'select' | 'checkboxes';

@Component({
	selector: 'app-story-playground',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			@switch (inputType()) {
				@case ('email') {
					<app-form-field
						[label]="'Email'"
						[field]="resolvedRequired() ? emailField : optionalEmailField"
						[hint]="resolvedHint()"
						[showRequired]="showRequired()"
						#ff="formField"
					>
						<input
							[id]="ff.resolvedId()"
							[formField]="resolvedRequired() ? emailField : optionalEmailField"
							type="email"
							class="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
							placeholder="you@example.com"
						/>
					</app-form-field>
				}
				@case ('text') {
					<app-form-field
						[label]="'Username'"
						[field]="resolvedRequired() ? textField : optionalTextField"
						[hint]="resolvedHint()"
						[showRequired]="showRequired()"
						#ff="formField"
					>
						<input
							[id]="ff.resolvedId()"
							[formField]="resolvedRequired() ? textField : optionalTextField"
							type="text"
							class="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
							placeholder="johndoe"
						/>
					</app-form-field>
				}
				@case ('select') {
					<app-form-field
						[label]="'Country'"
						[field]="resolvedRequired() ? selectField : optionalSelectField"
						[hint]="resolvedHint()"
						[showRequired]="showRequired()"
						#ff="formField"
					>
						<select
							[id]="ff.resolvedId()"
							[formField]="resolvedRequired() ? selectField : optionalSelectField"
							class="border-input bg-background focus:border-ring focus:ring-ring block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
						>
							<option value="" disabled>Select a country</option>
							<option value="us">United States</option>
							<option value="uk">United Kingdom</option>
							<option value="ca">Canada</option>
						</select>
					</app-form-field>
				}
				@case ('checkboxes') {
					<app-form-field
						[label]="'Notification preferences'"
						[field]="prefsField"
						[hint]="resolvedHint()"
						[showRequired]="showRequired()"
					>
						<div class="space-y-2">
							<label class="flex items-center gap-2 text-sm">
								<input [formField]="prefsField.emailNotifs" type="checkbox" class="border-input rounded" />
								Email notifications
							</label>
							<label class="flex items-center gap-2 text-sm">
								<input [formField]="prefsField.smsNotifs" type="checkbox" class="border-input rounded" />
								SMS notifications
							</label>
							<label class="flex items-center gap-2 text-sm">
								<input [formField]="prefsField.pushNotifs" type="checkbox" class="border-input rounded" />
								Push notifications
							</label>
						</div>
					</app-form-field>
				}
			}
		}
	`,
})
class StoryPlayground {
	private readonly translation = inject(Translation);

	readonly inputType = input<InputType>('email');
	readonly showHint = input<boolean>(false);
	readonly resolvedRequired = input<boolean>(true);
	readonly showRequired = input<boolean | undefined>(undefined);
	readonly language = input<Language>('en');
	readonly isReady = signal(false);

	private readonly emailModel = signal('');
	readonly emailField: FieldTree<string> = form(
		this.emailModel,
		schema<string>((path) => {
			required(path);
			email(path);
		}),
	);
	readonly optionalEmailField: FieldTree<string> = form(
		this.emailModel,
		schema<string>((path) => {
			email(path);
		}),
	);

	private readonly textModel = signal('');
	readonly textField: FieldTree<string> = form(
		this.textModel,
		schema<string>((path) => {
			required(path);
		}),
	);
	readonly optionalTextField: FieldTree<string> = form(this.textModel);

	private readonly selectModel = signal('');
	readonly selectField: FieldTree<string> = form(
		this.selectModel,
		schema<string>((path) => {
			required(path);
		}),
	);
	readonly optionalSelectField: FieldTree<string> = form(this.selectModel);

	private readonly prefsModel = signal({ emailNotifs: true, smsNotifs: false, pushNotifs: true });
	readonly prefsField: FieldTree<{ emailNotifs: boolean; smsNotifs: boolean; pushNotifs: boolean }> = form(
		this.prefsModel,
	);

	protected readonly resolvedHint = computed(() => {
		if (!this.showHint()) return undefined;
		const hints: Record<InputType, string> = {
			email: 'Enter your work email',
			text: 'Choose a unique username',
			select: 'Select your country of residence',
			checkboxes: 'Choose how you want to be notified',
		};
		return hints[this.inputType()];
	});

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => this.isReady.set(true));
		});
	}
}

@Component({
	selector: 'app-story-text-input',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			<app-form-field [label]="'Email'" [field]="emailField" #ff="formField">
				<input
					[id]="ff.resolvedId()"
					[formField]="emailField"
					type="email"
					class="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
					placeholder="you@example.com"
				/>
			</app-form-field>
		}
	`,
})
class StoryTextInput {
	private readonly translation = inject(Translation);

	readonly language = input<Language>('en');
	readonly isReady = signal(false);

	private readonly model = signal('');
	readonly emailField: FieldTree<string> = form(
		this.model,
		schema<string>((path) => {
			required(path);
			email(path);
		}),
	);

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => this.isReady.set(true));
		});
	}
}

@Component({
	selector: 'app-story-with-hint',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			<app-form-field [label]="'Username'" [field]="usernameField" [hint]="'Choose a unique username'" #ff="formField">
				<input
					[id]="ff.resolvedId()"
					[formField]="usernameField"
					type="text"
					class="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
					placeholder="johndoe"
				/>
			</app-form-field>
		}
	`,
})
class StoryWithHint {
	private readonly translation = inject(Translation);

	readonly language = input<Language>('en');
	readonly isReady = signal(false);

	private readonly model = signal('');
	readonly usernameField: FieldTree<string> = form(this.model);

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => this.isReady.set(true));
		});
	}
}

@Component({
	selector: 'app-story-required-error',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			<app-form-field [label]="'Full name'" [field]="nameField" #ff="formField">
				<input
					[id]="ff.resolvedId()"
					[formField]="nameField"
					type="text"
					class="border-input bg-background placeholder:text-muted-foreground focus:border-destructive focus:ring-destructive block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
				/>
			</app-form-field>
		}
	`,
})
class StoryRequiredError {
	private readonly translation = inject(Translation);

	readonly language = input<Language>('en');
	readonly isReady = signal(false);

	private readonly model = signal('');
	readonly nameField: FieldTree<string> = form(
		this.model,
		schema<string>((path) => {
			required(path);
		}),
	);

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => {
				this.nameField().markAsTouched();
				this.isReady.set(true);
			});
		});
	}
}

@Component({
	selector: 'app-story-email-error',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			<app-form-field [label]="'Email'" [field]="emailField" #ff="formField">
				<input
					[id]="ff.resolvedId()"
					[formField]="emailField"
					type="email"
					class="border-input bg-background placeholder:text-muted-foreground focus:border-destructive focus:ring-destructive block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
				/>
			</app-form-field>
		}
	`,
})
class StoryEmailError {
	private readonly translation = inject(Translation);

	readonly language = input<Language>('en');
	readonly isReady = signal(false);

	private readonly model = signal('notanemail');
	readonly emailField: FieldTree<string> = form(
		this.model,
		schema<string>((path) => {
			required(path);
			email(path);
		}),
	);

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => {
				this.emailField().markAsTouched();
				this.isReady.set(true);
			});
		});
	}
}

@Component({
	selector: 'app-story-min-length-error',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			<app-form-field [label]="'Password'" [field]="passwordField" #ff="formField">
				<input
					[id]="ff.resolvedId()"
					[formField]="passwordField"
					type="password"
					class="border-input bg-background placeholder:text-muted-foreground focus:border-destructive focus:ring-destructive block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
				/>
			</app-form-field>
		}
	`,
})
class StoryMinLengthError {
	private readonly translation = inject(Translation);

	readonly language = input<Language>('en');
	readonly isReady = signal(false);

	private readonly model = signal('abc');
	readonly passwordField: FieldTree<string> = form(
		this.model,
		schema<string>((path) => {
			required(path);
			minLength(path, 8);
		}),
	);

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => {
				this.passwordField().markAsTouched();
				this.isReady.set(true);
			});
		});
	}
}

@Component({
	selector: 'app-story-select-input',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			<app-form-field [label]="'Country'" [field]="countryField" #ff="formField">
				<select
					[id]="ff.resolvedId()"
					[formField]="countryField"
					class="border-input bg-background focus:border-ring focus:ring-ring block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none"
				>
					<option value="" disabled>Select a country</option>
					<option value="us">United States</option>
					<option value="uk">United Kingdom</option>
					<option value="ca">Canada</option>
				</select>
			</app-form-field>
		}
	`,
})
class StorySelectInput {
	private readonly translation = inject(Translation);

	readonly language = input<Language>('en');
	readonly isReady = signal(false);

	private readonly model = signal('');
	readonly countryField: FieldTree<string> = form(
		this.model,
		schema<string>((path) => {
			required(path);
		}),
	);

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => this.isReady.set(true));
		});
	}
}

@Component({
	selector: 'app-story-checkbox-list',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			<app-form-field [label]="'Notification preferences'" [field]="prefsField" [showRequired]="false">
				<div class="space-y-2">
					<label class="flex items-center gap-2 text-sm">
						<input [formField]="prefsField.emailNotifs" type="checkbox" class="border-input rounded" />
						Email notifications
					</label>
					<label class="flex items-center gap-2 text-sm">
						<input [formField]="prefsField.smsNotifs" type="checkbox" class="border-input rounded" />
						SMS notifications
					</label>
					<label class="flex items-center gap-2 text-sm">
						<input [formField]="prefsField.pushNotifs" type="checkbox" class="border-input rounded" />
						Push notifications
					</label>
				</div>
			</app-form-field>
		}
	`,
})
class StoryCheckboxList {
	private readonly translation = inject(Translation);

	readonly language = input<Language>('en');
	readonly isReady = signal(false);

	private readonly model = signal({ emailNotifs: true, smsNotifs: false, pushNotifs: true });
	readonly prefsField: FieldTree<{ emailNotifs: boolean; smsNotifs: boolean; pushNotifs: boolean }> = form(this.model);

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => this.isReady.set(true));
		});
	}
}

@Component({
	selector: 'app-story-disabled',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			<app-form-field [label]="'Email (read only)'" [field]="emailField" [showRequired]="false" #ff="formField">
				<input
					[id]="ff.resolvedId()"
					[formField]="emailField"
					[disabled]="emailField().disabled()"
					type="email"
					class="border-input bg-muted text-muted-foreground block w-full rounded-lg border px-3 py-2 text-sm shadow-sm"
				/>
			</app-form-field>
		}
	`,
})
class StoryDisabled {
	private readonly translation = inject(Translation);

	readonly language = input<Language>('en');
	readonly isReady = signal(false);

	private readonly model = signal('user@example.com');
	readonly emailField: FieldTree<string> = form(this.model);

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => this.isReady.set(true));
		});
	}
}

// --- Meta ---

const allWrappers = [
	StoryPlayground,
	StoryTextInput,
	StoryWithHint,
	StoryRequiredError,
	StoryEmailError,
	StoryMinLengthError,
	StorySelectInput,
	StoryCheckboxList,
	StoryDisabled,
];

const meta: Meta = {
	title: 'Components/FormField',
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({ imports: allWrappers }),
		applicationConfig({
			providers: [Translation, ...provideSignalFormsConfig({})],
		}),
	],
	argTypes: {
		language: {
			control: 'select',
			options: ['en', 'es'],
			description: 'Language for translated validation messages',
			table: {
				type: { summary: 'Language' },
				defaultValue: { summary: 'en' },
			},
		},
	},
};
export default meta;

// --- Stories ---

export const Playground: StoryObj = {
	args: { inputType: 'email', showHint: false, required: true, showRequired: undefined, language: 'en' },
	argTypes: {
		inputType: {
			control: 'select',
			options: ['email', 'text', 'select', 'checkboxes'],
			description: 'Type of form input to display',
			table: {
				type: { summary: 'InputType' },
				defaultValue: { summary: 'email' },
			},
		},
		showHint: {
			control: 'boolean',
			description: 'Show hint text below the field',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		required: {
			control: 'boolean',
			description: 'Whether the field has required validation (affects actual validation behavior)',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
		},
		showRequired: {
			control: 'select',
			options: [undefined, true, false],
			description: 'Override asterisk visibility (e.g. hide on login forms where all fields are required)',
			table: {
				type: { summary: 'boolean | undefined' },
				defaultValue: { summary: 'undefined (auto-detect)' },
			},
		},
	},
	render: (args) => ({
		template: `<app-story-playground [inputType]="'${args['inputType']}'" [showHint]="${args['showHint']}" [resolvedRequired]="${args['required']}" [showRequired]="${args['showRequired']}" [language]="'${args['language']}'" />`,
	}),
};

export const TextInput: StoryObj = {
	args: { language: 'en' },
	render: (args) => ({ template: `<app-story-text-input [language]="'${args['language']}'" />` }),
};

export const WithHint: StoryObj = {
	args: { language: 'en' },
	render: (args) => ({ template: `<app-story-with-hint [language]="'${args['language']}'" />` }),
};

export const RequiredError: StoryObj = {
	args: { language: 'en' },
	render: (args) => ({ template: `<app-story-required-error [language]="'${args['language']}'" />` }),
};

export const EmailError: StoryObj = {
	args: { language: 'en' },
	render: (args) => ({ template: `<app-story-email-error [language]="'${args['language']}'" />` }),
};

export const MinLengthError: StoryObj = {
	args: { language: 'en' },
	render: (args) => ({ template: `<app-story-min-length-error [language]="'${args['language']}'" />` }),
};

export const SelectInput: StoryObj = {
	args: { language: 'en' },
	render: (args) => ({ template: `<app-story-select-input [language]="'${args['language']}'" />` }),
};

export const CheckboxList: StoryObj = {
	args: { language: 'en' },
	render: (args) => ({ template: `<app-story-checkbox-list [language]="'${args['language']}'" />` }),
};

export const Disabled: StoryObj = {
	args: { language: 'en' },
	render: (args) => ({ template: `<app-story-disabled [language]="'${args['language']}'" />` }),
};
