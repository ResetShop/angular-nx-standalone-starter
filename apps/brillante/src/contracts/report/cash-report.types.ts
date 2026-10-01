/**
 * Period and branch of a cash report. Dates are calendar days formatted `yyyy-MM-dd`; the
 * provider widens them to the whole day on the wire.
 */
export interface CashReportRequest {
	startDate: string
	endDate: string
	branchId?: number
}

export interface CashReportConceptDto {
	id: number
	description: string
	transactionType: { id: number; description: string }
	parent: { id: number; description: string } | null
}

/**
 * The subset of a `GET /cash` transaction that the cash report reads. `amount` arrives as a
 * decimal string and `date` as an ISO timestamp.
 */
export interface CashReportTransactionDto {
	id: number
	concept: CashReportConceptDto
	amount: string
	date: string
	note: string | null
	paymentMethod: { id: number; description: string }
	officeBranch: { id: number; name: string } | null
	audit: { createdBy: { userName: string } | null } | null
}
