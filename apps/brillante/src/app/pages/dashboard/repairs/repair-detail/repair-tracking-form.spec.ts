import { provideSignalFormsConfig } from '@angular/forms/signals'
import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import { mapRepairDto } from '@domain/repair/repair.mapper'
import type { Repair } from '@domain/repair/repair.model'
import { createMockRepairDto, MOCK_REPAIR_STATUSES } from '@providers/repair/repair.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { fireEvent, render, screen } from '@testing-library/angular'
import { selectOption } from '../testing/form-events'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import { RepairTrackingForm, type RepairTrackingSubmission } from './repair-tracking-form'

const PAYMENT_METHODS: PaymentMethodDto[] = [
	{ id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] },
	{ id: 4, description: 'Transferencia', allowsInstallments: false, installments: [] },
]

describe('RepairTrackingForm', () => {
	let onSave: MockFn<[RepairTrackingSubmission], void>

	beforeEach(() => {
		clearAllMocks()
		onSave = fn<[RepairTrackingSubmission], void>()
	})

	function storedRepair(overrides: Parameters<typeof createMockRepairDto>[0] = {}): Repair {
		return mapRepairDto(createMockRepairDto({ id: 9, price: '900', cost: '400', note: 'Sin novedades', ...overrides }))
	}

	async function renderForm(repair: Repair = storedRepair(), saving = false) {
		return render(RepairTrackingForm, {
			inputs: { repair, statuses: MOCK_REPAIR_STATUSES, paymentMethods: PAYMENT_METHODS, saving },
			on: { save: onSave },
			providers: [{ provide: Translation, useValue: repairsTranslation }, ...provideSignalFormsConfig({})],
		})
	}

	const saveButton = () => screen.getByRole('button', { name: /^save tracking|^saving/i })

	function finishTheRepair(): void {
		selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.FINISHED_AND_PAID))
	}

	it('fills the fields with the stored tracking data', async () => {
		await renderForm()

		expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveValue(String(RepairStatusId.ENTERED))
		expect(screen.getByLabelText(/^Price/)).toHaveValue(900)
		expect(screen.getByLabelText(/^Cost/)).toHaveValue(400)
		expect(screen.getByLabelText(/^Warranty/)).toHaveValue(3)
		expect(screen.getByLabelText(/^Repair notes/)).toHaveValue('Sin novedades')
	})

	it('cannot be saved until something changes', async () => {
		await renderForm()

		expect(saveButton()).toBeDisabled()
	})

	it('emits the changes without a transaction while the repair is still open', async () => {
		await renderForm()

		selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.IN_PROGRESS))
		fireEvent.input(screen.getByLabelText(/^Repair notes/), { target: { value: ' Esperando repuesto ' } })
		fireEvent.click(saveButton())

		const { changes, generateTransaction } = onSave.calls[0][0]
		expect(generateTransaction).toBe(false)
		expect(changes.status).toEqual({ id: RepairStatusId.IN_PROGRESS, description: 'En progreso' })
		expect(changes.note).toBe('Esperando repuesto')
		expect(changes.price).toBe(900)
		expect(changes.payments).toEqual([])
		expect(screen.queryByRole('group', { name: 'Payments' })).not.toBeInTheDocument()
	})

	describe('closing the repair', () => {
		it('asks for the payments that settle the price', async () => {
			await renderForm()

			finishTheRepair()

			expect(screen.getByRole('group', { name: 'Payments' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Add payment' })).toBeInTheDocument()
		})

		it('cannot be saved until the payments add up to the price', async () => {
			await renderForm()
			finishTheRepair()

			expect(screen.getByRole('alert')).toHaveTextContent('The payments must add up to the price of the repair.')
			expect(saveButton()).toBeDisabled()
		})

		it('adds a cash payment for the pending amount', async () => {
			await renderForm()
			finishTheRepair()

			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))

			expect(screen.getByLabelText(/^Amount 1/)).toHaveValue(900)
			expect(screen.getByRole('combobox', { name: /^Payment method 1/ })).toHaveValue('1')
			expect(screen.getByText(/Total paid:/)).toHaveTextContent('900.00')
			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})

		it('emits the payments with the transaction flag once they add up', async () => {
			await renderForm()
			finishTheRepair()
			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))
			fireEvent.input(screen.getByLabelText(/^Amount 1/), { target: { value: '500' } })
			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))
			selectOption(screen.getByRole('combobox', { name: /^Payment method 2/ }), '4')

			fireEvent.click(saveButton())

			const { changes, generateTransaction } = onSave.calls[0][0]
			expect(generateTransaction).toBe(true)
			expect(changes.payments).toEqual([
				{ id: null, amount: 500, date: null, paymentMethodId: 1, paymentMethodDescription: 'Efectivo' },
				{ id: null, amount: 400, date: null, paymentMethodId: 4, paymentMethodDescription: 'Transferencia' },
			])
		})

		it('removes a payment', async () => {
			await renderForm()
			finishTheRepair()
			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))

			fireEvent.click(screen.getByRole('button', { name: 'Remove payment 1' }))

			expect(screen.queryByLabelText(/^Amount 1/)).not.toBeInTheDocument()
			expect(saveButton()).toBeDisabled()
		})

		it('does not ask for payments when the repair has no price', async () => {
			await renderForm(storedRepair({ price: '0' }))

			finishTheRepair()

			expect(screen.queryByRole('group', { name: 'Payments' })).not.toBeInTheDocument()
		})

		it('keeps the booking date of a stored payment', async () => {
			const stored = storedRepair({
				status: { id: RepairStatusId.FINISHED_AND_PAID, description: 'Finalizada y abonada' },
				moneyTransactions: [
					{ id: 4, amount: '900', date: '2024-05-09T10:00:00.000Z', paymentMethod: { id: 1, description: 'Efectivo' } },
				],
			})
			await renderForm(stored)

			fireEvent.input(screen.getByLabelText(/^Repair notes/), { target: { value: 'Entregado' } })
			fireEvent.click(saveButton())

			const [payment] = onSave.calls[0][0].changes.payments
			expect(payment.id).toBe(4)
			expect(payment.date).toEqual(new Date('2024-05-09T10:00:00.000Z'))
		})
	})

	it('cannot be saved with a negative price', async () => {
		await renderForm()

		fireEvent.input(screen.getByLabelText(/^Price/), { target: { value: '-5' } })

		expect(saveButton()).toBeDisabled()
	})

	it('cannot be saved with a warranty longer than 24 months', async () => {
		await renderForm()

		fireEvent.input(screen.getByLabelText(/^Warranty/), { target: { value: '25' } })

		expect(saveButton()).toBeDisabled()
	})

	it('disables saving and labels the button while a save is in flight', async () => {
		await renderForm(storedRepair(), true)

		expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
	})
})
