import { Component, computed, effect, ErrorHandler, inject, input, signal } from '@angular/core'
import {
	email,
	form,
	provideSignalFormsConfig,
	required,
	schema,
	FormField as SignalFormField,
	type FieldTree,
} from '@angular/forms/signals'
import { Combobox } from '@components/combobox/combobox'
import { Select } from '@components/select/select'
import type { SelectOption } from '@components/select/select-option'
import { Translation, type Language } from '@providers/i18n/translation'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import { FormField } from './form-field'

// --- Story wrapper components ---

type InputType = 'email' | 'text' | 'select' | 'checkbox' | 'combobox' | 'date'

const COUNTRY_OPTIONS: SelectOption[] = [
	{ value: 'us', label: 'United States' },
	{ value: 'uk', label: 'United Kingdom' },
	{ value: 'ca', label: 'Canada' },
]

@Component({
	selector: 'app-story-playground',
	standalone: true,
	imports: [FormField, SignalFormField, Select, Combobox],
	template: `
		@if (isReady()) {
			@switch (inputType()) {
				@case ('email') {
					<app-form-field [label]="'Email'" [hint]="resolvedHint()" [showRequired]="showRequired()">
						<input
							[formField]="hasRequired() ? emailField : optionalEmailField"
							type="email"
							placeholder="you@example.com"
						/>
					</app-form-field>
				}
				@case ('text') {
					<app-form-field [label]="'Username'" [hint]="resolvedHint()" [showRequired]="showRequired()">
						<input [formField]="hasRequired() ? textField : optionalTextField" type="text" placeholder="johndoe" />
					</app-form-field>
				}
				@case ('select') {
					<app-form-field [label]="'Country'" [hint]="resolvedHint()" [showRequired]="showRequired()">
						<app-select
							[formField]="hasRequired() ? selectField : optionalSelectField"
							[options]="countryOptions"
							[placeholder]="'Select a country'"
						/>
					</app-form-field>
				}
				@case ('checkbox') {
					<app-form-field
						[label]="'Accept terms and conditions'"
						[hint]="resolvedHint()"
						[showRequired]="showRequired()"
					>
						<input [formField]="hasRequired() ? checkboxField : optionalCheckboxField" type="checkbox" />
					</app-form-field>
				}
				@case ('combobox') {
					<app-form-field [label]="'Country'" [hint]="resolvedHint()" [showRequired]="showRequired()">
						<app-combobox
							[formField]="hasRequired() ? selectField : optionalSelectField"
							[options]="countryOptions"
							[placeholder]="'Search a country'"
						/>
					</app-form-field>
				}
				@case ('date') {
					<app-form-field [label]="'Birth date'" [hint]="resolvedHint()" [showRequired]="showRequired()">
						<input [formField]="hasRequired() ? dateField : optionalDateField" [attr.lang]="language()" type="date" />
					</app-form-field>
				}
			}
		}
	`,
})
class StoryPlayground {
	private readonly errorHandler = inject(ErrorHandler)
	private readonly translation = inject(Translation)

	public readonly inputType = input<InputType>('email')
	public readonly showHint = input<boolean>(false)
	public readonly hasRequired = input<boolean>(true)
	public readonly showRequired = input<boolean | undefined>(undefined)
	public readonly language = input<Language>('en')
	protected readonly isReady = signal(false)

	private readonly emailModel = signal('')
	protected readonly emailField: FieldTree<string> = form(
		this.emailModel,
		schema<string>((path) => {
			required(path)
			email(path)
		}),
	)
	protected readonly optionalEmailField: FieldTree<string> = form(
		this.emailModel,
		schema<string>((path) => {
			email(path)
		}),
	)

	private readonly textModel = signal('')
	protected readonly textField: FieldTree<string> = form(
		this.textModel,
		schema<string>((path) => {
			required(path)
		}),
	)
	protected readonly optionalTextField: FieldTree<string> = form(this.textModel)

	private readonly selectModel = signal('')
	protected readonly selectField: FieldTree<string> = form(
		this.selectModel,
		schema<string>((path) => {
			required(path)
		}),
	)
	protected readonly optionalSelectField: FieldTree<string> = form(this.selectModel)

	protected readonly countryOptions = COUNTRY_OPTIONS

	private readonly checkboxModel = signal(false)
	protected readonly checkboxField: FieldTree<boolean> = form(
		this.checkboxModel,
		schema<boolean>((path) => {
			required(path)
		}),
	)
	protected readonly optionalCheckboxField: FieldTree<boolean> = form(this.checkboxModel)

	private readonly dateModel = signal('')
	protected readonly dateField: FieldTree<string> = form(
		this.dateModel,
		schema<string>((path) => {
			required(path)
		}),
	)
	protected readonly optionalDateField: FieldTree<string> = form(this.dateModel)

	protected readonly resolvedHint = computed(() => {
		if (!this.showHint()) return undefined
		const hints: Record<InputType, string> = {
			email: 'Enter your work email',
			text: 'Choose a unique username',
			select: 'Select your country of residence',
			checkbox: 'Required to proceed',
			combobox: 'Search and select your country',
			date: 'Enter your date of birth',
		}
		return hints[this.inputType()]
	})

	private readonly syncLanguageEffect = effect(() => {
		const lang = this.language()
		this.isReady.set(false)
		this.translation
			.setLanguage(lang)
			.then(() => this.isReady.set(true))
			.catch((error: unknown) => this.errorHandler.handleError(error))
	})
}

// --- Meta ---

const meta: Meta<StoryPlayground> = {
	title: 'Components/FormField',
	tags: ['autodocs'],
	component: StoryPlayground,
	decorators: [
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
}
export default meta

// --- Stories ---

export const Playground: StoryObj<StoryPlayground> = {
	args: { inputType: 'email', showHint: false, hasRequired: true, showRequired: undefined, language: 'en' },
	argTypes: {
		inputType: {
			control: 'select',
			options: ['email', 'text', 'select', 'checkbox', 'combobox', 'date'],
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
		hasRequired: {
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
		language: {
			control: 'select',
			options: ['en', 'es'],
			description: 'Language for translated validation messages and date picker locale (date input only)',
			table: {
				type: { summary: 'Language' },
				defaultValue: { summary: 'en' },
			},
		},
	},
	render: (args) => ({ props: args }),
}
