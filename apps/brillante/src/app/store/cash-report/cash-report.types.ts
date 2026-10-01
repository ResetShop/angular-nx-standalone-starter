import type { CashReportRequest } from '@contracts/report/cash-report.types'
import type { CashReportEntry } from '@domain/report/cash-report.interface'

export interface CashReportReadError {
	list: string | null
}

export interface CashReportState {
	entries: CashReportEntry[]
	/** The period and branch of the report on display; null until the first report is generated. */
	request: CashReportRequest | null
	isLoadingList: boolean
	readError: CashReportReadError
}

export const initialCashReportState: CashReportState = {
	entries: [],
	request: null,
	isLoadingList: false,
	readError: { list: null },
}
