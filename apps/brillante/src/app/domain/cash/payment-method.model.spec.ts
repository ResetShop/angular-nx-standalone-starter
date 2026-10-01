import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import { toPaymentMethod } from './payment-method.model'

describe('toPaymentMethod', () => {
	const credit: PaymentMethodDto = {
		id: 6,
		description: 'LaPos Crédito',
		allowsInstallments: true,
		installments: [
			{ installments: 1, interestRate: '0.0500' },
			{ installments: 3, interestRate: '0.1250' },
		],
	}

	it('should parse the decimal interest rates into numbers', () => {
		expect(toPaymentMethod(credit).installments).toEqual([
			{ installments: 1, interestRate: 0.05 },
			{ installments: 3, interestRate: 0.125 },
		])
	})

	it('should keep the identity fields untouched', () => {
		expect(toPaymentMethod(credit)).toEqual(
			expect.objectContaining({ id: 6, description: 'LaPos Crédito', allowsInstallments: true }),
		)
	})

	it('should drop the instalments when the method has a single plan', () => {
		const cash: PaymentMethodDto = {
			id: 1,
			description: 'Efectivo',
			allowsInstallments: false,
			installments: [{ installments: 1, interestRate: '0' }],
		}

		expect(toPaymentMethod(cash).installments).toEqual([])
	})

	it('should map a method without plans to an empty instalment list', () => {
		expect(toPaymentMethod({ ...credit, installments: [] }).installments).toEqual([])
	})
})
