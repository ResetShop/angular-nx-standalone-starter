/**
 * Wire shape of `GET /cash/getPaymentMethods`: interest rates arrive as decimal strings.
 */
export interface InstallmentDto {
	installments: number
	interestRate: string | number
}

export interface PaymentMethodDto {
	id: number
	description: string
	allowsInstallments: boolean
	installments: InstallmentDto[]
}

export const PaymentMethodId = Object.freeze({
	CASH: 1,
	MERCADO_PAGO: 2,
	TODO_PAGO: 3,
	BANK_TRANSFER: 4,
	LAPOS_DEBIT: 5,
	LAPOS_CREDIT: 6,
	POINT_CREDIT: 7,
	POINT_DEBIT: 8,
	QR_MERCADO_PAGO: 9,
	MERCADOPAGO_TO_MERCADOPAGO: 10,
	BILLETERA_SANTA_FE: 11,
} as const)

export type PaymentMethodId = (typeof PaymentMethodId)[keyof typeof PaymentMethodId]

/**
 * Payment method as embedded in cash transactions: the API sends only the id and description there,
 * while `GET /cash/getPaymentMethods` also sends the installment plans.
 */
export type PaymentMethodRefDto = Pick<PaymentMethodDto, 'id' | 'description'> &
	Partial<Pick<PaymentMethodDto, 'allowsInstallments' | 'installments'>>
