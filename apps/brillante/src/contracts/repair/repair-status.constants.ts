/**
 * Ids of the repair statuses served by `GET /repair/getStatusData`. The API owns the catalogue;
 * these ids drive the business rules that depend on a specific status.
 */
export const RepairStatusId = Object.freeze({
	ENTERED: 0,
	IN_PROGRESS: 1,
	WAITING_FOR_SPARE_PARTS: 2,
	REQUIRES_CUSTOMER_INTERVENTION: 3,
	READY_FOR_DELIVER: 4,
	FINISHED_AND_PAID: 5,
	REENTERED: 6,
	RETURNED_WITHOUT_REPAIR: 7,
	IN_BOARD_REPAIR: 8,
	REENTERED_WITH_WARRANTY: 9,
	FINISHED_DIAGNOSTICS: 10,
	IN_SAFE_DEPOSIT_BOX: 11,
	BOUGHT: 12,
	FINISHED_BY_WARRANTY: 13,
} as const)

export type RepairStatusId = (typeof RepairStatusId)[keyof typeof RepairStatusId]
