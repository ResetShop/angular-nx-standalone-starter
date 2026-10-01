import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import { createMockUser } from '@mocks/user.mock'
import { type CashTransactionDraft, toCashActor, toCashTransactionRequest } from './cash-request.mapper'
import type { PaymentMethod } from './payment-method.model'

const concept: TransactionConceptDto = {
	id: 11,
	description: 'Venta',
	transactionType: { id: 1, description: 'Ingreso' },
	parent: null,
	children: [],
	userAssignable: true,
	enabled: true,
	modifiable: true,
}

const cash: PaymentMethod = { id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] }
const credit: PaymentMethod = {
	id: 6,
	description: 'LaPos Crédito',
	allowsInstallments: true,
	installments: [{ installments: 3, interestRate: 0.12 }],
}

function draft(overrides: Partial<CashTransactionDraft> = {}): CashTransactionDraft {
	return {
		concept,
		note: 'Venta de mostrador',
		date: new Date('2026-03-04T15:30:00.000Z'),
		payments: [{ amount: 1000, paymentMethod: cash }],
		...overrides,
	}
}

describe('toCashTransactionRequest', () => {
	it('should serialise the date as an ISO instant', () => {
		expect(toCashTransactionRequest(draft()).date).toBe('2026-03-04T15:30:00.000Z')
	})

	it('should use the sum of the payments as the transaction amount', () => {
		const request = toCashTransactionRequest(
			draft({
				payments: [
					{ amount: 600.1, paymentMethod: cash },
					{ amount: 399.9, paymentMethod: credit },
				],
			}),
		)

		expect(request.amount).toBe(1000)
	})

	it('should use the first payment method as the headline method', () => {
		const request = toCashTransactionRequest(
			draft({
				payments: [
					{ amount: 10, paymentMethod: credit },
					{ amount: 10, paymentMethod: cash },
				],
			}),
		)

		expect(request.paymentMethod.id).toBe(6)
	})

	it('should send the payment method snapshots with numeric interest rates', () => {
		const request = toCashTransactionRequest(draft({ payments: [{ amount: 10, paymentMethod: credit }] }))

		expect(request.payments).toEqual([
			{
				amount: 10,
				paymentMethod: {
					id: 6,
					description: 'LaPos Crédito',
					allowsInstallments: true,
					installments: [{ installments: 3, interestRate: 0.12 }],
				},
			},
		])
	})

	it('should omit the id of a new transaction', () => {
		expect(toCashTransactionRequest(draft())).not.toHaveProperty('id')
	})

	it('should include the id of an existing transaction', () => {
		expect(toCashTransactionRequest(draft({ id: 42 })).id).toBe(42)
	})

	it('should keep the operation an existing transaction belongs to', () => {
		const request = toCashTransactionRequest(draft({ operation: { id: 7, description: 'Reparación' } }))

		expect(request.operation).toEqual({ id: 7, description: 'Reparación' })
	})

	it('should omit the operation when there is none', () => {
		expect(toCashTransactionRequest(draft({ operation: null }))).not.toHaveProperty('operation')
	})
})

describe('toCashActor', () => {
	it('should send the identity fields of the user', () => {
		const user = createMockUser({
			id: 5,
			userName: 'clerk',
			firstName: 'Ana',
			lastName: 'Gómez',
			email: 'ana@brillante.test',
			roles: [{ id: 3, description: 'Counter clerk' }],
		})

		expect(toCashActor(user)).toEqual({
			id: 5,
			userName: 'clerk',
			firstName: 'Ana',
			lastName: 'Gómez',
			email: 'ana@brillante.test',
			avatar: null,
			roles: [{ id: 3, description: 'Counter clerk' }],
			hasFinishedRegistration: true,
		})
	})

	it('should not leak the derived permissions', () => {
		const actor = toCashActor(createMockUser({ permissions: ['cash:transaction:manage'] }))

		expect(actor).not.toHaveProperty('permissions')
	})
})
