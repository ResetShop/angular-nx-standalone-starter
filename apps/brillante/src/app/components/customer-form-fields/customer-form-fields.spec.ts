import { Component, input, signal } from '@angular/core'
import { form, readonly, required } from '@angular/forms/signals'
import { createEmptyCustomerForm, type CustomerFormModel } from '@domain/customer/customer-form'
import { customerTranslation } from '@domain/customer/customer-translation.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { CustomerFormFields } from './customer-form-fields'

@Component({
	selector: 'app-host',
	standalone: true,
	imports: [CustomerFormFields],
	template: `
		<app-customer-form-fields [fields]="customerForm" [showCustomerDetails]="showCustomerDetails()" />
		<p>DNI value: {{ model().dni }}</p>
	`,
})
class Host {
	public readonly showCustomerDetails = input(true)
	protected readonly model = signal<CustomerFormModel>({ ...createEmptyCustomerForm(), email: 'ana@brillante.test' })
	protected readonly customerForm = form(this.model, (customer) => {
		required(customer.firstName)
		readonly(customer.email)
	})
}

describe('CustomerFormFields', () => {
	async function renderFields(showCustomerDetails = true) {
		return render(Host, {
			inputs: { showCustomerDetails },
			providers: [{ provide: Translation, useValue: customerTranslation }],
		})
	}

	it('renders every customer input with its label', async () => {
		await renderFields()

		expect(screen.getByLabelText(/dni/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/telephone/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
	})

	it('shows the telephone hint', async () => {
		await renderFields()

		expect(screen.getByText('Digits only')).toBeInTheDocument()
	})

	it('hides the customer-only inputs when customer details are not requested', async () => {
		await renderFields(false)

		expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		expect(screen.queryByLabelText('DNI')).not.toBeInTheDocument()
		expect(screen.queryByLabelText(/birth date/i)).not.toBeInTheDocument()
		expect(screen.queryByLabelText(/telephone/i)).not.toBeInTheDocument()
		expect(screen.queryByLabelText(/address/i)).not.toBeInTheDocument()
	})

	it('writes typed text into the form model', async () => {
		await renderFields()

		await userEvent.type(screen.getByLabelText(/dni/i), '30123456')

		expect(screen.getByText('DNI value: 30123456')).toBeInTheDocument()
	})

	it('shows the current email and honours a read-only rule from the form', async () => {
		await renderFields()

		const email = screen.getByLabelText(/email/i)

		expect(email).toHaveValue('ana@brillante.test')
		expect(email).toHaveAttribute('readonly')
	})

	it('shows the required error once a required field is touched and left empty', async () => {
		await renderFields()

		await userEvent.click(screen.getByLabelText(/first name/i))
		await userEvent.tab()

		expect(await screen.findByText('This field is required')).toBeInTheDocument()
	})
})
