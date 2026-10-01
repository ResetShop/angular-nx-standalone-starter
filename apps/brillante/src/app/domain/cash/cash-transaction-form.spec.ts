import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import { createMockCashTransactionDto, createMockConceptDto } from '@providers/cash/cash.mock'
import {
	type CashTransactionFormModel,
	type CashTransactionFormSource,
	createCashTransactionFormModel,
	toCashTransactionDraft,
} from './cash-transaction-form'
import { toCashTransaction } from './cash-transaction.mapper'
import type { PaymentMethod } from './payment-method.model'

const cash: PaymentMethod = { id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] }
const credit: PaymentMethod = {
	id: 6,
	description: 'LaPos Crédito',
	allowsInstallments: true,
	installments: [{ installments: 3, interestRate: 0.12 }],
}

const salesParent = createMockConceptDto({ id: 1, description: 'Ventas', parent: null })
const salesChild = createMockConceptDto({ id: 11, description: 'Accesorios', parent: salesParent })
const expensesParent = createMockConceptDto({
	id: 2,
	description: 'Gastos',
	parent: null,
	transactionType: { id: 0, description: 'Egreso' },
})
const expensesChild = createMockConceptDto({ id: 21, description: 'Limpieza', parent: expensesParent })

const concepts: TransactionConceptDto[] = [
	{ ...salesParent, children: [salesChild] },
	{ ...expensesParent, children: [expensesChild] },
]

function source(overrides: Partial<CashTransactionFormSource> = {}): CashTransactionFormSource {
	return { transaction: null, concepts, paymentMethods: [cash, credit], ...overrides }
}

describe('createCashTransactionFormModel', () => {
	it('should start a new transaction on the first concept, subconcept and payment method', () => {
		const model = createCashTransactionFormModel(source())

		expect(model.parentConceptId).toBe('1')
		expect(model.conceptId).toBe('11')
		expect(model.payments).toEqual([{ amount: 0, paymentMethodId: '1', installments: '' }])
		expect(model.note).toBe('')
	})

	it('should start empty when there are no concepts or payment methods yet', () => {
		const model = createCashTransactionFormModel(source({ concepts: [], paymentMethods: [] }))

		expect(model.parentConceptId).toBe('')
		expect(model.conceptId).toBe('')
		expect(model.payments[0].paymentMethodId).toBe('')
	})

	it('should seed an existing transaction with its own concept, payments, note and date', () => {
		const transaction = toCashTransaction(
			createMockCashTransactionDto({
				id: 9,
				concept: expensesChild,
				note: 'Compra de insumos',
				date: '2026-03-04T15:30:00.000Z',
				payments: [
					{
						amount: '400.00',
						paymentMethod: { id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] },
					},
					{
						amount: '100.00',
						paymentMethod: { id: 6, description: 'LaPos Crédito', allowsInstallments: true, installments: [] },
					},
				],
			}),
		)

		const model = createCashTransactionFormModel(source({ transaction }))

		expect(model.parentConceptId).toBe('2')
		expect(model.conceptId).toBe('21')
		expect(model.note).toBe('Compra de insumos')
		expect(model.payments.map((payment) => [payment.amount, payment.paymentMethodId])).toEqual([
			[400, '1'],
			[100, '6'],
		])
	})

	it('should fall back to the transaction payment method when it has no payment rows', () => {
		const transaction = toCashTransaction(createMockCashTransactionDto({ amount: '750.00', payments: [] }))

		const model = createCashTransactionFormModel(source({ transaction }))

		expect(model.payments).toEqual([{ amount: 750, paymentMethodId: '1', installments: '' }])
	})
})

describe('toCashTransactionDraft', () => {
	const model: CashTransactionFormModel = {
		parentConceptId: '1',
		conceptId: '11',
		payments: [{ amount: 1500, paymentMethodId: '6', installments: '3' }],
		note: '  Venta de mostrador  ',
		date: '2026-03-04T15:30',
	}

	it('should stamp a new transaction with the current time', () => {
		const now = new Date('2026-06-01T10:00:00.000Z')

		const draft = toCashTransactionDraft(model, source(), now)

		expect(draft?.date).toBe(now)
		expect(draft?.id).toBeUndefined()
	})

	it('should resolve the concept and the payment methods from their ids', () => {
		const draft = toCashTransactionDraft(model, source())

		expect(draft?.concept).toBe(salesChild)
		expect(draft?.payments).toEqual([{ amount: 1500, paymentMethod: credit }])
	})

	it('should trim the note', () => {
		expect(toCashTransactionDraft(model, source())?.note).toBe('Venta de mostrador')
	})

	it('should keep the id, the operation and the typed date of an existing transaction', () => {
		const transaction = toCashTransaction(
			createMockCashTransactionDto({ id: 9, operation: { id: 7, description: 'Reparación' } }),
		)

		const draft = toCashTransactionDraft(model, source({ transaction }))

		expect(draft?.id).toBe(9)
		expect(draft?.operation).toEqual({ id: 7, description: 'Reparación' })
		expect(draft?.date).toEqual(new Date(2026, 2, 4, 15, 30))
	})

	it('should keep the original date of an existing transaction when the typed one is invalid', () => {
		const transaction = toCashTransaction(createMockCashTransactionDto({ date: '2026-03-04T15:30:00.000Z' }))

		const draft = toCashTransactionDraft({ ...model, date: '' }, source({ transaction }))

		expect(draft?.date).toEqual(new Date('2026-03-04T15:30:00.000Z'))
	})

	it('should return null when the concept does not belong to the chosen parent', () => {
		expect(toCashTransactionDraft({ ...model, conceptId: '21' }, source())).toBeNull()
	})

	it('should return null when a payment method is unknown', () => {
		const unknown = { ...model, payments: [{ amount: 1, paymentMethodId: '99', installments: '' }] }

		expect(toCashTransactionDraft(unknown, source())).toBeNull()
	})

	it('should return null when there are no payments', () => {
		expect(toCashTransactionDraft({ ...model, payments: [] }, source())).toBeNull()
	})
})
