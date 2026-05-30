import { Component, input, signal } from '@angular/core'
import {
	form,
	provideSignalFormsConfig,
	required,
	schema,
	FormField as SignalFormField,
	type FieldTree,
} from '@angular/forms/signals'
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
		<app-form-field [label]="'Country'" [hint]="showHint() ? 'Search and select your country' : undefined">
			<app-combobox
				[formField]="hasRequired() ? requiredField : optionalField"
				[options]="options()"
				[placeholder]="'Search a country'"
				[isDisabled]="isDisabled()"
			/>
		</app-form-field>
	`,
})
class StoryCombobox {
	public readonly options = input<SelectOption[]>(COUNTRY_OPTIONS)
	public readonly isDisabled = input<boolean>(false)
	public readonly showHint = input<boolean>(false)
	public readonly hasRequired = input<boolean>(true)

	private readonly model = signal('')
	protected readonly requiredField: FieldTree<string> = form(
		this.model,
		schema<string>((path) => {
			required(path)
		}),
	)
	protected readonly optionalField: FieldTree<string> = form(this.model)
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
	render: (args) => ({ props: args }),
}
export default meta

export const Playground: StoryObj<StoryCombobox> = {
	args: { options: COUNTRY_OPTIONS, isDisabled: false, showHint: false, hasRequired: true },
	argTypes: {
		isDisabled: { control: 'boolean', description: 'Disable the combobox' },
		showHint: { control: 'boolean', description: 'Show hint text' },
		hasRequired: { control: 'boolean', description: 'Whether field has required validation' },
	},
}

export const Disabled: StoryObj<StoryCombobox> = {
	args: { options: COUNTRY_OPTIONS, isDisabled: true, hasRequired: false },
}

export const WithValidation: StoryObj<StoryCombobox> = {
	args: { options: COUNTRY_OPTIONS, hasRequired: true },
}

export const ManyOptions: StoryObj<StoryCombobox> = {
	args: { options: MANY_OPTIONS, hasRequired: false },
}
