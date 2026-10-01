import { Component, signal } from '@angular/core'
import { form, required } from '@angular/forms/signals'
import { createEmptyCustomerForm, type CustomerFormModel } from '@domain/customer/customer-form'
import { customerTranslation } from '@domain/customer/customer-translation.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig, moduleMetadata } from '@storybook/angular'
import { CustomerFormFields } from './customer-form-fields'

@Component({
	selector: 'app-customer-form-fields-story',
	standalone: true,
	imports: [CustomerFormFields],
	template: `
		<app-customer-form-fields [fields]="customerForm" [showCustomerDetails]="showCustomerDetails" />
	`,
})
class CustomerFormFieldsStory {
	public showCustomerDetails = true
	protected readonly model = signal<CustomerFormModel>({
		...createEmptyCustomerForm(),
		firstName: 'Ana',
		lastName: 'Perez',
		email: 'ana@brillante.test',
	})
	protected readonly customerForm = form(this.model, (customer) => {
		required(customer.dni)
		required(customer.firstName)
		required(customer.lastName)
		required(customer.email)
	})
}

const meta: Meta<CustomerFormFieldsStory> = {
	component: CustomerFormFieldsStory,
	title: 'Components/CustomerFormFields',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({ providers: [{ provide: Translation, useValue: customerTranslation }] }),
		moduleMetadata({ imports: [CustomerFormFields] }),
	],
	parameters: {
		docs: {
			description: {
				component:
					'The customer detail inputs shared by the clients drawers and the profile page. The host owns the signal form ' +
					'(validation, reset, submission); this component only lays the fields out.',
			},
			canvas: { sourceState: 'shown' },
		},
	},
}

export default meta
type Story = StoryObj<CustomerFormFieldsStory>

/**
 * Every customer input: DNI, name, email, birth date, telephone and address.
 */
export const Default: Story = {
	args: { showCustomerDetails: true },
}

/**
 * Staff profile: only the name and email inputs are shown.
 */
export const NameAndEmailOnly: Story = {
	args: { showCustomerDetails: false },
}
