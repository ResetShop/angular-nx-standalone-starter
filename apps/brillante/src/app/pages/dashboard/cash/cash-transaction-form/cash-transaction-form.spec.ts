import { Component, input, output } from '@angular/core'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import type { CashTransactionDraft } from '@domain/cash/cash-request.mapper'
import { toCashTransaction } from '@domain/cash/cash-transaction.mapper'
import type { CashTransaction } from '@domain/cash/cash-transaction.model'
import type { PaymentMethod } from '@domain/cash/payment-method.model'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks, fn } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { createMockCashTransactionDto, createMockConceptDto } from '../cash.mock'
import { cashTranslation } from '../cash.testing'
import { CashTransactionForm } from './cash-transaction-form'

/** Stands in for the drawer, which renders the submit button outside the form component. */
@Component({
	selector: 'app-form-host',
	standalone: true,
	imports: [CashTransactionForm],
	template: `
		<app-cash-transaction-form
			(submitted)="submitted.emit($event)"
			[concepts]="concepts()"
			[paymentMethods]="paymentMethods()"
			[transaction]="transaction()"
			[userName]="userName()"
			[submitting]="submitting()"
			#formRef
		/>
		<button [attr.form]="formRef.formId" [disabled]="!formRef.isFormValid()" type="submit">Save</button>
		<output>{{ formRef.isDirty() ? 'dirty' : 'pristine' }}</output>
	`,
})
class FormHost {
	public readonly concepts = input.required<readonly TransactionConceptDto[]>()
	public readonly paymentMethods = input.required<readonly PaymentMethod[]>()
	public readonly transaction = input<CashTransaction | null>(null)
	public readonly userName = input('')
	public readonly submitting = input(false)
	public readonly submitted = output<CashTransactionDraft>()
}

const salesParent = createMockConceptDto({ id: 1, description: 'Ventas', parent: null })
const salesAccessories = createMockConceptDto({ id: 11, description: 'Accesorios', parent: salesParent })
const salesRepairs = createMockConceptDto({ id: 12, description: 'Reparaciones', parent: salesParent })
const expensesParent = createMockConceptDto({
	id: 2,
	description: 'Gastos',
	parent: null,
	transactionType: { id: 0, description: 'Egreso' },
})
const expensesCleaning = createMockConceptDto({ id: 21, description: 'Limpieza', parent: expensesParent })

const concepts: TransactionConceptDto[] = [
	{ ...salesParent, children: [salesAccessories, salesRepairs] },
	{ ...expensesParent, children: [expensesCleaning] },
]

const cash: PaymentMethod = { id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] }
const transfer: PaymentMethod = { id: 4, description: 'Transferencia', allowsInstallments: false, installments: [] }

describe('CashTransactionForm', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	async function renderForm(
		inputs: {
			transaction?: CashTransaction | null
			submitting?: boolean
			userName?: string
		} = {},
	) {
		const submitted = fn<[CashTransactionDraft], void>()
		const view = await render(FormHost, {
			inputs: { concepts, paymentMethods: [cash, transfer], userName: 'clerk', ...inputs },
			on: { submitted },
			providers: [{ provide: Translation, useValue: cashTranslation }, ...provideSignalFormsConfig({})],
		})
		return { ...view, submitted }
	}

	async function pickOption(combobox: HTMLElement, name: string) {
		await userEvent.click(combobox)
		await userEvent.click(await screen.findByRole('option', { name }))
	}

	async function fillValidForm() {
		await userEvent.type(screen.getByLabelText('Amount'), '1500')
		await userEvent.type(screen.getByLabelText(/^Note/), 'Venta de mostrador')
	}

	it('should start on the first concept, subconcept and payment method', async () => {
		await renderForm()

		const [concept, subconcept, method] = screen.getAllByRole('combobox')
		expect(concept).toHaveTextContent('Ventas')
		expect(subconcept).toHaveTextContent('Accesorios')
		expect(method).toHaveTextContent('Efectivo')
	})

	it('should show the type of the chosen concept', async () => {
		await renderForm()

		expect(screen.getByText('Income')).toBeInTheDocument()
	})

	it('should switch the type and reset the subconcept when another concept is chosen', async () => {
		await renderForm()

		await pickOption(screen.getAllByRole('combobox')[0], 'Gastos')

		expect(screen.getByText('Expense')).toBeInTheDocument()
		expect(screen.getAllByRole('combobox')[1]).toHaveTextContent('Limpieza')
	})

	it('should show the responsible user', async () => {
		await renderForm()

		expect(screen.getByText('clerk')).toBeInTheDocument()
	})

	it('should not offer the date of a new transaction', async () => {
		await renderForm()

		expect(screen.queryByLabelText('Date and time')).not.toBeInTheDocument()
	})

	it('should keep saving disabled until the amount and the note are valid', async () => {
		await renderForm()
		const save = screen.getByRole('button', { name: 'Save' })
		expect(save).toBeDisabled()

		await userEvent.type(screen.getByLabelText('Amount'), '1500')
		expect(save).toBeDisabled()

		await userEvent.type(screen.getByLabelText(/^Note/), 'Venta de mostrador')
		expect(save).toBeEnabled()
	})

	it('should reject a note shorter than ten characters', async () => {
		await renderForm()

		await userEvent.type(screen.getByLabelText(/^Note/), 'corta')
		await userEvent.tab()

		expect(await screen.findByText('Must be at least 10 characters')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
	})

	it('should reject an amount below one', async () => {
		await renderForm()
		await userEvent.type(screen.getByLabelText(/^Note/), 'Venta de mostrador')

		await userEvent.type(screen.getByLabelText('Amount'), '0')
		await userEvent.tab()

		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
	})

	it('should emit the draft of a new transaction', async () => {
		const { submitted } = await renderForm()

		await pickOption(screen.getAllByRole('combobox')[1], 'Reparaciones')
		await pickOption(screen.getAllByRole('combobox')[2], 'Transferencia')
		await fillValidForm()
		await userEvent.click(screen.getByRole('button', { name: 'Save' }))

		expect(submitted.calls).toHaveLength(1)
		const draft = submitted.calls[0][0]
		expect(draft.id).toBeUndefined()
		expect(draft.concept.id).toBe(12)
		expect(draft.note).toBe('Venta de mostrador')
		expect(draft.payments).toEqual([{ amount: 1500, paymentMethod: transfer }])
	})

	it('should not emit while the form is invalid', async () => {
		const { submitted } = await renderForm()

		await userEvent.click(screen.getByRole('button', { name: 'Save' }))

		expect(submitted.calls).toHaveLength(0)
	})

	it('should prefill the form when editing and emit the id of the transaction', async () => {
		const transaction = toCashTransaction(
			createMockCashTransactionDto({
				id: 9,
				concept: expensesCleaning,
				note: 'Compra de insumos',
				amount: '400.00',
				payments: [{ amount: '400.00', paymentMethod: { ...transfer, installments: [] } }],
			}),
		)
		const { submitted } = await renderForm({ transaction })

		expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('Gastos')
		expect(screen.getAllByRole('combobox')[1]).toHaveTextContent('Limpieza')
		expect(screen.getAllByRole('combobox')[2]).toHaveTextContent('Transferencia')
		expect(screen.getByLabelText('Amount')).toHaveValue(400)
		expect(screen.getByLabelText(/^Note/)).toHaveValue('Compra de insumos')
		expect(screen.getByLabelText('Date and time')).toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Save' }))

		expect(submitted.calls[0][0]).toEqual(expect.objectContaining({ id: 9, note: 'Compra de insumos' }))
	})

	it('should not emit while a submission is in flight', async () => {
		const { submitted } = await renderForm({ submitting: true })
		await fillValidForm()

		await userEvent.click(screen.getByRole('button', { name: 'Save' }))

		expect(submitted.calls).toHaveLength(0)
	})

	it('should report itself dirty only after the user changes a field', async () => {
		await renderForm()
		expect(screen.getByRole('status')).toHaveTextContent('pristine')

		await userEvent.type(screen.getByLabelText(/^Note/), 'Venta')

		expect(screen.getByRole('status')).toHaveTextContent('dirty')
	})
})
