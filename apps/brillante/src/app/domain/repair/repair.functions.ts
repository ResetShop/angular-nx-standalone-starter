import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import type { Repair } from './repair.model'

const FINISHED_STATUS_IDS: readonly number[] = [
	RepairStatusId.FINISHED_AND_PAID,
	RepairStatusId.RETURNED_WITHOUT_REPAIR,
	RepairStatusId.FINISHED_DIAGNOSTICS,
]

const VOUCHER_STATUS_IDS: readonly number[] = [
	RepairStatusId.REQUIRES_CUSTOMER_INTERVENTION,
	RepairStatusId.READY_FOR_DELIVER,
	RepairStatusId.FINISHED_AND_PAID,
	RepairStatusId.IN_BOARD_REPAIR,
]

/**
 * A repair in a finished status is out of the workshop: it is hidden from the default list and
 * closing it with a price generates the cash transaction.
 */
export function isFinishedStatus(statusId: number): boolean {
	return FINISHED_STATUS_IDS.includes(statusId)
}

/**
 * The cash transaction of a repair is only generated when the repair is closed with a price.
 */
export function shouldGenerateTransaction(statusId: number, price: number): boolean {
	return isFinishedStatus(statusId) && price !== 0
}

/**
 * The customer voucher needs a describing note, a price and a status the customer is waiting on.
 */
export function canGenerateVoucher(repair: Repair): boolean {
	return VOUCHER_STATUS_IDS.includes(repair.status.id) && repair.note.trim() !== '' && repair.price !== 0
}
