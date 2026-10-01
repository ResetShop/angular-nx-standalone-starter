import type { CashTransactionDto } from '@contracts/cash/cash-transaction.types'
import { createMockCashTransactionDto } from '@pages/dashboard/cash/cash.mock'
import { toCashTransaction } from './cash-transaction.mapper'

describe('toCashTransaction', () => {
	it('should parse the ISO date into a Date', () => {
		const transaction = toCashTransaction(createMockCashTransactionDto({ date: '2026-03-04T15:30:00.000Z' }))

		expect(transaction.date).toEqual(new Date('2026-03-04T15:30:00.000Z'))
	})

	it('should parse the amount and the payment amounts into numbers', () => {
		const transaction = toCashTransaction(
			createMockCashTransactionDto({
				amount: '1500.50',
				payments: [
					{
						amount: '1500.50',
						paymentMethod: { id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] },
					},
				],
			}),
		)

		expect(transaction.amount).toBe(1500.5)
		expect(transaction.payments[0].amount).toBe(1500.5)
	})

	it('should parse the instalment rates of the payment methods', () => {
		const transaction = toCashTransaction(
			createMockCashTransactionDto({
				paymentMethod: {
					id: 6,
					description: 'LaPos Crédito',
					allowsInstallments: true,
					installments: [
						{ installments: 1, interestRate: '0.05' },
						{ installments: 3, interestRate: '0.12' },
					],
				},
			}),
		)

		expect(transaction.paymentMethod.installments[1]).toEqual({ installments: 3, interestRate: 0.12 })
	})

	it('should classify a transaction of an income concept as income', () => {
		const transaction = toCashTransaction(createMockCashTransactionDto())

		expect(transaction.kind).toBe('income')
	})

	it('should classify a transaction of an expense concept as expense', () => {
		const dto = createMockCashTransactionDto()
		const transaction = toCashTransaction({
			...dto,
			concept: { ...dto.concept, transactionType: { id: 0, description: 'Egreso' } },
		})

		expect(transaction.kind).toBe('expense')
	})

	it('should expose the audit dates and author', () => {
		const transaction = toCashTransaction(createMockCashTransactionDto())

		expect(transaction.createdAt).toBeInstanceOf(Date)
		expect(transaction.updatedAt).toBeInstanceOf(Date)
		expect(transaction.createdByUserName).toBe('clerk')
	})

	it('should tolerate a missing audit and operation', () => {
		const dto = createMockCashTransactionDto()
		const transaction = toCashTransaction({
			...dto,
			audit: undefined as unknown as typeof dto.audit,
			operation: null,
		})

		expect(transaction.createdAt).toBeNull()
		expect(transaction.createdByUserName).toBeNull()
		expect(transaction.operation).toBeNull()
	})

	it('should flag the transaction as editable when its concept and parent are user assignable', () => {
		expect(toCashTransaction(createMockCashTransactionDto()).editable).toBe(true)
	})

	it('should flag the transaction as read-only when its parent concept is not user assignable', () => {
		const dto = createMockCashTransactionDto()
		const parent = dto.concept.parent
		const transaction = toCashTransaction({
			...dto,
			concept: { ...dto.concept, parent: parent ? { ...parent, userAssignable: false } : null },
		})

		expect(transaction.editable).toBe(false)
	})

	it('should map a row as the production API sends it: numeric amounts, bare payment methods, 0/1 flags', () => {
		const row = {
			id: 34805,
			date: '2026-09-30T15:57:34.000Z',
			note: 'Compra de hojas A4 x2',
			concept: {
				id: 289,
				description: 'Insumos diarios',
				userAssignable: 1,
				parent: { id: 165, description: 'Compra de Insumos', userAssignable: 1 },
				transactionType: { id: 0, description: 'Egreso' },
				children: [],
			},
			amount: 19000,
			paymentMethod: { id: 1, description: 'Efectivo' },
			payments: [{ amount: 19000, paymentMethod: { id: 1, description: 'Efectivo' } }],
			audit: {
				createdBy: { userName: 'juan' },
				createdAt: '2026-09-30T15:57:34.000Z',
				updatedAt: '2026-09-30T15:57:34.000Z',
			},
		} as unknown as CashTransactionDto

		const transaction = toCashTransaction(row)

		expect(transaction.amount).toBe(19000)
		expect(transaction.kind).toBe('expense')
		expect(transaction.editable).toBe(true)
		expect(transaction.paymentMethod).toEqual({
			id: 1,
			description: 'Efectivo',
			allowsInstallments: false,
			installments: [],
		})
		expect(transaction.payments[0].amount).toBe(19000)
	})

	it('should flag a system concept flagged 0 as not editable', () => {
		const dto = createMockCashTransactionDto()
		const row = { ...dto, concept: { ...dto.concept, userAssignable: 0 } } as unknown as CashTransactionDto

		expect(toCashTransaction(row).editable).toBe(false)
	})
})
