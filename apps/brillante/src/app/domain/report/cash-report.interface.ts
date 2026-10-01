export interface CashReportEntry {
	readonly id: number
	readonly date: Date
	readonly branchName: string
	readonly conceptName: string
	readonly subconceptName: string
	readonly note: string
	readonly paymentMethodId: number
	readonly paymentMethodName: string
	readonly income: number
	readonly expense: number
	/** Income minus expense: positive for money that entered the register, negative for money that left it. */
	readonly balance: number
	readonly createdBy: string
}

export interface CashReportTotals {
	readonly income: number
	readonly expense: number
	readonly balance: number
}

export interface CashReportGroup extends CashReportTotals {
	readonly key: string
	readonly label: string
	readonly count: number
}

export interface CashReportSummary {
	readonly totals: CashReportTotals
	readonly byConcept: readonly CashReportGroup[]
	readonly byPaymentMethod: readonly CashReportGroup[]
}
