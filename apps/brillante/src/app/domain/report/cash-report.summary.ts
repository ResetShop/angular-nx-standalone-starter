import type { CashReportEntry, CashReportGroup, CashReportSummary, CashReportTotals } from './cash-report.interface'

const EMPTY_TOTALS: CashReportTotals = { income: 0, expense: 0, balance: 0 }

function addEntry(totals: CashReportTotals, entry: CashReportEntry): CashReportTotals {
	return {
		income: totals.income + entry.income,
		expense: totals.expense + entry.expense,
		balance: totals.balance + entry.balance,
	}
}

function groupBy(
	entries: readonly CashReportEntry[],
	keyOf: (entry: CashReportEntry) => string,
	labelOf: (entry: CashReportEntry) => string,
): CashReportGroup[] {
	const groups = new Map<string, CashReportGroup>()
	for (const entry of entries) {
		const key = keyOf(entry)
		const current = groups.get(key) ?? { ...EMPTY_TOTALS, key, label: labelOf(entry), count: 0 }
		groups.set(key, { ...addEntry(current, entry), key, label: current.label, count: current.count + 1 })
	}
	return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label))
}

export function summarizeCashReport(entries: readonly CashReportEntry[]): CashReportSummary {
	return {
		totals: entries.reduce(addEntry, EMPTY_TOTALS),
		byConcept: groupBy(
			entries,
			(entry) => entry.conceptName,
			(entry) => entry.conceptName,
		),
		byPaymentMethod: groupBy(
			entries,
			(entry) => String(entry.paymentMethodId),
			(entry) => entry.paymentMethodName,
		),
	}
}
