import { Component, input, linkedSignal } from '@angular/core'
import { form, provideSignalFormsConfig } from '@angular/forms/signals'
import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import { mapRepairDto } from '@domain/repair/repair.mapper'
import type { Repair } from '@domain/repair/repair.model'
import { createMockRepairDto, MOCK_REPAIR_STATUSES } from '@providers/repair/repair.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { fireEvent, render, screen } from '@testing-library/angular'
import { selectOption } from '../testing/form-events'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import { RepairTrackingFields } from './repair-tracking-fields'
import {
	generatesTransaction,
	paymentsMismatch,
	paymentsTotal,
	repairTrackingSchema,
	trackingFormModelFromRepair,
	type RepairTrackingFormModel,
} from './repair-tracking.form'

const PAYMENT_METHODS: PaymentMethodDto[] = [
	{ id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] },
	{ id: 4, description: 'Transferencia', allowsInstallments: false, installments: [] },
]

@Component({
	selector: 'app-tracking-fields-host',
	standalone: true,
	imports: [RepairTrackingFields],
	template: `
		<app-repair-tracking-fields [tracking]="trackingForm" [statuses]="statuses" [paymentMethods]="paymentMethods" />
		<output aria-label="model">{{ serialized() }}</output>
	`,
})
class TrackingFieldsHost {
	public readonly repair = input.required<Repair>()

	protected readonly statuses = MOCK_REPAIR_STATUSES
	protected readonly paymentMethods = PAYMENT_METHODS

	private readonly model = linkedSignal<RepairTrackingFormModel>(() => trackingFormModelFromRepair(this.repair()))
	protected readonly trackingForm = form(this.model, repairTrackingSchema)
	protected readonly serialized = () => JSON.stringify(this.model())
}

describe('RepairTrackingFields', () => {
	beforeEach(() => clearAllMocks())

	function storedRepair(overrides: Parameters<typeof createMockRepairDto>[0] = {}): Repair {
		return mapRepairDto(createMockRepairDto({ id: 9, price: '900', cost: '400', note: 'Sin novedades', ...overrides }))
	}

	async function renderFields(repair: Repair = storedRepair()) {
		return render(TrackingFieldsHost, {
			inputs: { repair },
			providers: [{ provide: Translation, useValue: repairsTranslation }, ...provideSignalFormsConfig({})],
		})
	}

	const model = (): RepairTrackingFormModel => JSON.parse(screen.getByLabelText('model').textContent ?? '{}')

	function finishTheRepair(): void {
		selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.FINISHED_AND_PAID))
	}

	it('fills the fields with the stored tracking data', async () => {
		await renderFields()

		expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveValue(String(RepairStatusId.ENTERED))
		expect(screen.getByLabelText(/^Price/)).toHaveValue(900)
		expect(screen.getByLabelText(/^Cost/)).toHaveValue(400)
		expect(screen.getByLabelText(/^Warranty/)).toHaveValue(3)
		expect(screen.getByLabelText(/^Repair notes/)).toHaveValue('Sin novedades')
	})

	it('writes the edited values to the form model', async () => {
		await renderFields()

		selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.IN_PROGRESS))
		fireEvent.input(screen.getByLabelText(/^Repair notes/), { target: { value: 'Esperando repuesto' } })

		expect(model().statusId).toBe(String(RepairStatusId.IN_PROGRESS))
		expect(model().note).toBe('Esperando repuesto')
	})

	it('does not ask for payments while the repair is still open', async () => {
		await renderFields()

		expect(screen.queryByRole('group', { name: 'Payments' })).not.toBeInTheDocument()
	})

	describe('closing the repair', () => {
		it('asks for the payments that settle the price', async () => {
			await renderFields()

			finishTheRepair()

			expect(screen.getByRole('group', { name: 'Payments' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Add payment' })).toBeInTheDocument()
		})

		it('warns until the payments add up to the price', async () => {
			await renderFields()

			finishTheRepair()

			expect(screen.getByRole('alert')).toHaveTextContent('The payments must add up to the price of the repair.')
		})

		it('adds a cash payment for the pending amount', async () => {
			await renderFields()
			finishTheRepair()

			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))

			expect(screen.getByLabelText(/^Amount 1/)).toHaveValue(900)
			expect(screen.getByRole('combobox', { name: /^Payment method 1/ })).toHaveValue('1')
			expect(screen.getByText(/Total paid:/)).toHaveTextContent('900.00')
			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})

		it('splits the price between several payments', async () => {
			await renderFields()
			finishTheRepair()
			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))
			fireEvent.input(screen.getByLabelText(/^Amount 1/), { target: { value: '500' } })

			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))
			selectOption(screen.getByRole('combobox', { name: /^Payment method 2/ }), '4')

			expect(model().payments).toEqual([
				{ id: null, paymentMethodId: '1', amount: 500 },
				{ id: null, paymentMethodId: '4', amount: 400 },
			])
		})

		it('removes a payment', async () => {
			await renderFields()
			finishTheRepair()
			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))

			fireEvent.click(screen.getByRole('button', { name: 'Remove payment 1' }))

			expect(screen.queryByLabelText(/^Amount 1/)).not.toBeInTheDocument()
			expect(screen.getByRole('alert')).toBeInTheDocument()
		})

		it('does not ask for payments when the repair has no price', async () => {
			await renderFields(storedRepair({ price: '0' }))

			finishTheRepair()

			expect(screen.queryByRole('group', { name: 'Payments' })).not.toBeInTheDocument()
		})
	})
})

describe('tracking payment rules', () => {
	const model = (overrides: Partial<RepairTrackingFormModel>): RepairTrackingFormModel => ({
		statusId: String(RepairStatusId.FINISHED_AND_PAID),
		note: '',
		price: 900,
		cost: 0,
		paymentInAdvance: 0,
		warrantyTerm: 3,
		payments: [],
		...overrides,
	})

	it('generates a transaction only for a closed repair with a price', () => {
		expect(generatesTransaction(model({}))).toBe(true)
		expect(generatesTransaction(model({ price: 0 }))).toBe(false)
		expect(generatesTransaction(model({ statusId: String(RepairStatusId.IN_PROGRESS) }))).toBe(false)
	})

	it('adds the payment amounts up', () => {
		const payments = [
			{ id: null, paymentMethodId: '1', amount: 500.5 },
			{ id: 3, paymentMethodId: '4', amount: 399.5 },
		]

		expect(paymentsTotal(model({ payments }))).toBe(900)
	})

	it('reports a mismatch only for a closed repair whose payments miss the price', () => {
		const exact = [{ id: null, paymentMethodId: '1', amount: 900 }]
		const short = [{ id: null, paymentMethodId: '1', amount: 100 }]

		expect(paymentsMismatch(model({ payments: exact }))).toBe(false)
		expect(paymentsMismatch(model({ payments: short }))).toBe(true)
		expect(paymentsMismatch(model({ statusId: String(RepairStatusId.IN_PROGRESS), payments: short }))).toBe(false)
	})
})
