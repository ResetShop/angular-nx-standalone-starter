import { PaymentMethodId } from '@contracts/cash/payment-method.types'
import { roundToCents } from './money'
import type { Installment, PaymentMethod } from './payment-method.model'

export interface InstallmentQuote {
	readonly installments: number
	readonly interestRate: number
	/** Amount of each instalment, interest included. */
	readonly installmentAmount: number
	/** What the customer pays in total: `installmentAmount * installments`. */
	readonly total: number
}

/**
 * Credit-card method whose plans the shop uses as the price reference when quoting instalments.
 */
export function findReferencePaymentMethod(methods: readonly PaymentMethod[]): PaymentMethod | undefined {
	return methods.find((method) => method.id === PaymentMethodId.LAPOS_CREDIT)
}

export function findInstallmentPlan(plans: readonly Installment[], installments: number): Installment | undefined {
	return plans.find((plan) => plan.installments === installments)
}

/**
 * Quotes a price in `installments` payments: the price is split evenly and each part carries the
 * plan's interest rate (`price / n * (1 + rate)`). Returns `null` when the plan does not exist.
 */
export function quoteInstallments(
	price: number,
	installments: number,
	plans: readonly Installment[],
): InstallmentQuote | null {
	const plan = findInstallmentPlan(plans, installments)
	if (!plan || installments <= 0) return null
	const installmentAmount = roundToCents((price / installments) * (1 + plan.interestRate))
	return {
		installments,
		interestRate: plan.interestRate,
		installmentAmount,
		total: roundToCents(installmentAmount * installments),
	}
}
