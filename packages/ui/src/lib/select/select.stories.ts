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
import { Select } from './select'
import type { SelectOption } from './select-option'

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
	selector: 'app-story-select',
	standalone: true,
	imports: [FormField, SignalFormField, Select],
	template: `
		<app-form-field [label]="'Country'" [hint]="showHint() ? 'Select your country of residence' : undefined">
			<app-select
				[formField]="hasRequired() ? requiredField : optionalField"
				[options]="options()"
				[placeholder]="'Select a country'"
				[isDisabled]="isDisabled()"
			/>
		</app-form-field>
	`,
})
class StorySelect {
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

const meta: Meta<StorySelect> = {
	title: 'Components/Select',
	tags: ['autodocs'],
	component: StorySelect,
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

export const Playground: StoryObj<StorySelect> = {
	args: { options: COUNTRY_OPTIONS, isDisabled: false, showHint: false, hasRequired: true },
	argTypes: {
		isDisabled: { control: 'boolean', description: 'Disable the select' },
		showHint: { control: 'boolean', description: 'Show hint text' },
		hasRequired: { control: 'boolean', description: 'Whether field has required validation' },
	},
}

export const Disabled: StoryObj<StorySelect> = {
	args: { options: COUNTRY_OPTIONS, isDisabled: true, hasRequired: false },
	render: (args) => ({ props: args }),
}

export const WithValidation: StoryObj<StorySelect> = {
	args: { options: COUNTRY_OPTIONS, hasRequired: true },
}

export const ManyOptions: StoryObj<StorySelect> = {
	args: { options: MANY_OPTIONS, hasRequired: false },
}

/**
 * Mobile viewport (375 px) with 50 options — verifies the dropdown max-height is capped at
 * `min(60vh, 240px)`. On a 375 × 667 mobile viewport, 60vh ≈ 400 px so the 240 px cap wins;
 * on a shorter viewport (e.g. landscape phone at 375 px tall), the 60vh cap engages instead.
 */
export const MobileViewport: StoryObj<StorySelect> = {
	args: { options: MANY_OPTIONS, hasRequired: false },
	parameters: {
		docs: { canvas: { sourceState: 'shown' } },
		viewport: { defaultViewport: 'mobile' },
	},
}
