import { Component, computed, effect, inject, input, signal } from '@angular/core';
import {
	email,
	form,
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

type InputType = 'email' | 'text' | 'select';

@Component({
	selector: 'app-story-playground',
	standalone: true,
	imports: [FormField, SignalFormField],
	template: `
		@if (isReady()) {
			@switch (inputType()) {
				@case ('email') {
					<app-form-field [label]="'Email'" [hint]="resolvedHint()" [showRequired]="showRequired()" #ff="formField">
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
					<app-form-field [label]="'Username'" [hint]="resolvedHint()" [showRequired]="showRequired()" #ff="formField">
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
					<app-form-field [label]="'Country'" [hint]="resolvedHint()" [showRequired]="showRequired()" #ff="formField">
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

	protected readonly resolvedHint = computed(() => {
		if (!this.showHint()) return undefined;
		const hints: Record<InputType, string> = {
			email: 'Enter your work email',
			text: 'Choose a unique username',
			select: 'Select your country of residence',
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

// --- Meta ---

const meta: Meta = {
	title: 'Components/FormField',
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({ imports: [StoryPlayground] }),
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
			options: ['email', 'text', 'select'],
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
