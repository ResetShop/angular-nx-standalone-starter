import { applyEach, max, min, required, schema } from '@angular/forms/signals'
import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import { shouldGenerateTransaction } from '@domain/repair/repair.functions'
import type { Repair, RepairPayment, RepairStatus, RepairTrackingChanges } from '@domain/repair/repair.model'

export interface RepairPaymentFormRow {
	id: number | null
	paymentMethodId: string
	amount: number
}

/**
 * Form model of the tracking data of a repair. Selects bind strings, so the status and the
 * payment methods are held by id as strings.
 */
export interface RepairTrackingFormModel {
	statusId: string
	note: string
	price: number
	cost: number
	paymentInAdvance: number
	warrantyTerm: number
	payments: RepairPaymentFormRow[]
}

export function trackingFormModelFromRepair(repair: Repair): RepairTrackingFormModel {
	return {
		statusId: String(repair.status.id),
		note: repair.note,
		price: repair.price,
		cost: repair.cost,
		paymentInAdvance: repair.paymentInAdvance,
		warrantyTerm: repair.warrantyTerm,
		payments: repair.payments.map((payment) => ({
			id: payment.id,
			paymentMethodId: String(payment.paymentMethodId),
			amount: payment.amount,
		})),
	}
}

function toPayment(
	row: RepairPaymentFormRow,
	paymentMethods: readonly PaymentMethodDto[],
	stored: readonly RepairPayment[],
): RepairPayment {
	const paymentMethodId = Number(row.paymentMethodId)
	return {
		id: row.id,
		amount: row.amount,
		// A stored payment keeps its booking date so saving the repair does not rewrite it.
		date: stored.find((payment) => row.id !== null && payment.id === row.id)?.date ?? null,
		paymentMethodId,
		paymentMethodDescription: paymentMethods.find((method) => method.id === paymentMethodId)?.description ?? '',
	}
}

export function toTrackingChanges(
	model: RepairTrackingFormModel,
	statuses: readonly RepairStatus[],
	paymentMethods: readonly PaymentMethodDto[],
	stored: readonly RepairPayment[],
): RepairTrackingChanges {
	const statusId = Number(model.statusId)
	return {
		status: statuses.find((status) => status.id === statusId) ?? { id: statusId, description: '' },
		note: model.note.trim(),
		price: model.price,
		cost: model.cost,
		paymentInAdvance: model.paymentInAdvance,
		warrantyTerm: model.warrantyTerm,
		payments: model.payments.map((row) => toPayment(row, paymentMethods, stored)),
	}
}

/** A repair closed with a price registers its cash transaction, so its payments are captured. */
export function generatesTransaction(model: RepairTrackingFormModel): boolean {
	return shouldGenerateTransaction(Number(model.statusId), model.price)
}

export function paymentsTotal(model: RepairTrackingFormModel): number {
	return model.payments.reduce((sum, row) => sum + row.amount, 0)
}

/** The payments that settle a closed repair must add up to its price. */
export function paymentsMismatch(model: RepairTrackingFormModel): boolean {
	return generatesTransaction(model) && Math.abs(paymentsTotal(model) - model.price) > 0.005
}

export const repairTrackingSchema = schema<RepairTrackingFormModel>((tracking) => {
	required(tracking.statusId)
	min(tracking.price, 0)
	min(tracking.cost, 0)
	min(tracking.paymentInAdvance, 0)
	min(tracking.warrantyTerm, 0)
	max(tracking.warrantyTerm, 24)
	applyEach(tracking.payments, (row) => {
		min(row.amount, 0)
	})
})
