import { Component, effect, ErrorHandler, inject, input, signal } from '@angular/core'
import {
	form,
	provideSignalFormsConfig,
	required,
	schema,
	FormField as SignalFormField,
	type FieldTree,
} from '@angular/forms/signals'
import { Translation, type Language } from '@resetshop/angular-core/i18n/translation'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import { FormField } from '../form-field/form-field'
import type { SelectOption } from '../select/select-option'
import { Combobox } from './combobox'

const COUNTRY_OPTIONS: SelectOption[] = [
	{ value: 'us', label: 'United States' },
	{ value: 'uk', label: 'United Kingdom' },
	{ value: 'ca', label: 'Canada' },
	{ value: 'de', label: 'Germany' },
	{ value: 'fr', label: 'France' },
]

const MANY_OPTIONS: SelectOption[] = Array.from({ length: 50 }, (_, i) => ({
	value: `option-${i + 1}`,
	label: `Option ${i + 1}`,
}))

@Component({
	selector: 'app-story-combobox',
	standalone: true,
	imports: [FormField, SignalFormField, Combobox],
	template: `
		@if (isReady()) {
			<app-form-field [label]="'Country'" [hint]="showHint() ? 'Search and select your country' : undefined">
				<app-combobox
					[formField]="hasRequired() ? requiredField : optionalField"
					[options]="options()"
					[placeholder]="'Search a country'"
					[isDisabled]="isDisabled()"
				/>
			</app-form-field>
		}
	`,
})
class StoryCombobox {
	private readonly errorHandler = inject(ErrorHandler)
	private readonly translation = inject(Translation)

	public readonly options = input<SelectOption[]>(COUNTRY_OPTIONS)
	public readonly isDisabled = input<boolean>(false)
	public readonly showHint = input<boolean>(false)
	public readonly hasRequired = input<boolean>(true)
	public readonly language = input<Language>('en')
	protected readonly isReady = signal(false)

	private readonly model = signal('')
	protected readonly requiredField: FieldTree<string> = form(
		this.model,
		schema<string>((path) => {
			required(path)
		}),
	)
	protected readonly optionalField: FieldTree<string> = form(this.model)

	private readonly syncLanguageEffect = effect(() => {
		const lang = this.language()
		this.isReady.set(false)
		this.translation
			.setLanguage(lang)
			.then(() => this.isReady.set(true))
			.catch((error: unknown) => this.errorHandler.handleError(error))
	})
}

const meta: Meta<StoryCombobox> = {
	title: 'Components/Combobox',
	tags: ['autodocs'],
	component: StoryCombobox,
	decorators: [
		applicationConfig({
			providers: [...provideSignalFormsConfig({})],
		}),
	],
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
		},
	},
	argTypes: {
		language: {
			control: 'select',
			options: ['en', 'es'],
			description: 'Language for translated validation messages',
		},
	},
	render: (args) => ({ props: args }),
}
export default meta

export const Playground: StoryObj<StoryCombobox> = {
	args: { options: COUNTRY_OPTIONS, isDisabled: false, showHint: false, hasRequired: true, language: 'en' },
	argTypes: {
		isDisabled: { control: 'boolean', description: 'Disable the combobox' },
		showHint: { control: 'boolean', description: 'Show hint text' },
		hasRequired: { control: 'boolean', description: 'Whether field has required validation' },
	},
}

export const Disabled: StoryObj<StoryCombobox> = {
	args: { options: COUNTRY_OPTIONS, isDisabled: true, hasRequired: false, language: 'en' },
}

export const WithValidation: StoryObj<StoryCombobox> = {
	args: { options: COUNTRY_OPTIONS, hasRequired: true, language: 'en' },
}

export const ManyOptions: StoryObj<StoryCombobox> = {
	args: { options: MANY_OPTIONS, hasRequired: false, language: 'en' },
}
