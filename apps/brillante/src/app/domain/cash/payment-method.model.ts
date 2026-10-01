import type { PaymentMethodRefDto } from '@contracts/cash/payment-method.types'

export interface Installment {
	readonly installments: number
	readonly interestRate: number
}

export interface PaymentMethod {
	readonly id: number
	readonly description: string
	readonly allowsInstallments: boolean
	readonly installments: readonly Installment[]
}

/**
 * Maps the wire payment method (the `GET /cash` rows embed only its id and description), parsing the decimal interest rates. A method with a single
 * instalment plan offers no real choice, so its instalments are dropped.
 */
export function toPaymentMethod(dto: PaymentMethodRefDto): PaymentMethod {
	return {
		id: dto.id,
		description: dto.description,
		allowsInstallments: dto.allowsInstallments ?? false,
		installments:
			(dto.installments ?? []).length <= 1
				? []
				: (dto.installments ?? []).map((plan) => ({
						installments: plan.installments,
						interestRate: parseFloat(String(plan.interestRate)),
					})),
	}
}
