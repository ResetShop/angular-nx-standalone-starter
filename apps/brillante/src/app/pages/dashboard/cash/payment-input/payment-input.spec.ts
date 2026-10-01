import { Component, signal } from '@angular/core'
import { form, provideSignalFormsConfig } from '@angular/forms/signals'
import type { PaymentFormModel } from '@domain/cash/cash-transaction-form'
import type { PaymentMethod } from '@domain/cash/payment-method.model'
import { cashTranslation } from '@providers/cash/cash.testing'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { PaymentInput } from './payment-input'

const cash: PaymentMethod = { id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] }
const credit: PaymentMethod = {
	id: 6,
	description: 'LaPos Crédito',
	allowsInstallments: true,
	installments: [
		{ installments: 1, interestRate: 0.05 },
		{ installments: 3, interestRate: 0.12 },
	],
}

@Component({
	selector: 'app-host',
	standalone: true,
	imports: [PaymentInput],
	template: `
		<app-payment-input [payment]="paymentForm" [paymentMethods]="methods" />
		<p>Model: {{ model().amount }} / {{ model().paymentMethodId }} / {{ model().installments }}</p>
	`,
})
class Host {
	protected readonly methods = [cash, credit]
	public readonly model = signal<PaymentFormModel>({ amount: 0, paymentMethodId: '1', installments: '' })
	protected readonly paymentForm = form(this.model)
}

describe('PaymentInput', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	async function renderInput(model?: Partial<PaymentFormModel>) {
		const view = await render(Host, {
			providers: [{ provide: Translation, useValue: cashTranslation }, ...provideSignalFormsConfig({})],
		})
		if (model) {
			view.fixture.componentInstance.model.update((current) => ({ ...current, ...model }))
			view.fixture.detectChanges()
			await view.fixture.whenStable()
		}
		return view
	}

	it('should show the amount and the payment method with the current choice', async () => {
		await renderInput()

		expect(screen.getByLabelText('Amount')).toBeInTheDocument()
		expect(screen.getByRole('combobox')).toHaveTextContent('Efectivo')
	})

	it('should write the typed amount into the form', async () => {
		await renderInput()

		await userEvent.type(screen.getByLabelText('Amount'), '1500')

		expect(screen.getByText(/^Model: 1500 \//)).toBeInTheDocument()
	})

	it('should offer every payment method and write the chosen one into the form', async () => {
		await renderInput()

		await userEvent.click(screen.getByRole('combobox'))
		await userEvent.click(await screen.findByText('LaPos Crédito'))

		expect(screen.getByText(/ \/ 6 \//)).toBeInTheDocument()
	})

	it('should not offer instalments for a method without them', async () => {
		await renderInput()

		expect(screen.queryByText('Installments')).not.toBeInTheDocument()
	})

	it('should offer the instalment plans of a financed method', async () => {
		await renderInput({ paymentMethodId: '6' })

		expect(screen.getByText('Installments')).toBeInTheDocument()
		expect(screen.getAllByRole('combobox')).toHaveLength(2)
	})

	it('should quote the chosen instalment plan over the amount', async () => {
		await renderInput({ paymentMethodId: '6', amount: 3000, installments: '3' })

		expect(screen.getByRole('status')).toHaveTextContent('3 installment(s) of $ 1.120,00 - total $ 3.360,00')
	})

	it('should not quote before a plan is chosen', async () => {
		await renderInput({ paymentMethodId: '6', amount: 3000 })

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
	})

	it('should drop the instalment plan when the method does not offer it', async () => {
		const { fixture } = await renderInput({ paymentMethodId: '6', installments: '3' })

		fixture.componentInstance.model.update((current) => ({ ...current, paymentMethodId: '1' }))
		fixture.detectChanges()
		await fixture.whenStable()

		expect(fixture.componentInstance.model().installments).toBe('')
	})
})
