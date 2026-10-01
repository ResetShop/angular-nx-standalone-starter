import { formatReportDateTime } from './cash-report.format'
import type { CashReportEntry } from './cash-report.interface'

export interface CashReportCsvHeaders {
	readonly id: string
	readonly date: string
	readonly branch: string
	readonly concept: string
	readonly subconcept: string
	readonly note: string
	readonly paymentMethod: string
	readonly income: string
	readonly expense: string
	readonly balance: string
	readonly createdBy: string
}

function escapeCell(value: string | number): string {
	// Spreadsheet applications evaluate cells that start with these characters as formulas.
	const raw = String(value)
	const text = typeof value === 'string' && /^[=+@\t\r-]/.test(raw) ? `'${raw}` : raw
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toRow(cells: readonly (string | number)[]): string {
	return cells.map(escapeCell).join(',')
}

/**
 * Serialises the report as CSV. Amounts are plain decimals so spreadsheets can sum them.
 */
export function toCashReportCsv(entries: readonly CashReportEntry[], headers: CashReportCsvHeaders): string {
	const header = toRow([
		headers.id,
		headers.date,
		headers.branch,
		headers.concept,
		headers.subconcept,
		headers.note,
		headers.paymentMethod,
		headers.income,
		headers.expense,
		headers.balance,
		headers.createdBy,
	])
	const rows = entries.map((entry) =>
		toRow([
			entry.id,
			formatReportDateTime(entry.date),
			entry.branchName,
			entry.conceptName,
			entry.subconceptName,
			entry.note,
			entry.paymentMethodName,
			entry.income,
			entry.expense,
			entry.balance,
			entry.createdBy,
		]),
	)
	return [header, ...rows].join('\r\n')
}
