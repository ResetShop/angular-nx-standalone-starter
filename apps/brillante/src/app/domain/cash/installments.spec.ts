import { PaymentMethodId } from '@contracts/cash/payment-method.types'
import { findInstallmentPlan, findReferencePaymentMethod, quoteInstallments } from './installments'
import type { Installment, PaymentMethod } from './payment-method.model'

const plans: Installment[] = [
	{ installments: 1, interestRate: 0.05 },
	{ installments: 3, interestRate: 0.12 },
	{ installments: 6, interestRate: 0.2 },
]

function method(id: number, description: string): PaymentMethod {
	return { id, description, allowsInstallments: id === PaymentMethodId.LAPOS_CREDIT, installments: plans }
}

describe('quoteInstallments', () => {
	it('should split the price evenly and apply the interest rate to every instalment', () => {
		const quote = quoteInstallments(3000, 3, plans)

		expect(quote).toEqual({ installments: 3, interestRate: 0.12, installmentAmount: 1120, total: 3360 })
	})

	it('should quote a single payment with its own rate', () => {
		expect(quoteInstallments(1000, 1, plans)?.total).toBe(1050)
	})

	it('should round each instalment to cents', () => {
		expect(quoteInstallments(1000, 6, plans)?.installmentAmount).toBe(200)
		expect(quoteInstallments(100, 3, plans)?.installmentAmount).toBe(37.33)
	})

	it('should return null when the plan does not exist', () => {
		expect(quoteInstallments(1000, 12, plans)).toBeNull()
	})

	it('should return null when there are no plans', () => {
		expect(quoteInstallments(1000, 3, [])).toBeNull()
	})

	it('should return null for a non positive number of instalments', () => {
		expect(quoteInstallments(1000, 0, [{ installments: 0, interestRate: 0.1 }])).toBeNull()
	})
})

describe('findInstallmentPlan', () => {
	it('should find the plan by number of instalments', () => {
		expect(findInstallmentPlan(plans, 6)).toEqual({ installments: 6, interestRate: 0.2 })
	})

	it('should return undefined for an unknown plan', () => {
		expect(findInstallmentPlan(plans, 2)).toBeUndefined()
	})
})

describe('findReferencePaymentMethod', () => {
	it('should pick the credit card method', () => {
		const methods = [method(PaymentMethodId.CASH, 'Efectivo'), method(PaymentMethodId.LAPOS_CREDIT, 'LaPos Crédito')]

		expect(findReferencePaymentMethod(methods)?.description).toBe('LaPos Crédito')
	})

	it('should return undefined when the reference method is not available', () => {
		expect(findReferencePaymentMethod([method(PaymentMethodId.CASH, 'Efectivo')])).toBeUndefined()
	})
})
