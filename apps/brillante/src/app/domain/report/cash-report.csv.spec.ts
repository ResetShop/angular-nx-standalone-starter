import { type CashReportCsvHeaders, toCashReportCsv } from './cash-report.csv'
import type { CashReportEntry } from './cash-report.interface'

const headers: CashReportCsvHeaders = {
	id: 'ID',
	date: 'Date',
	branch: 'Branch',
	concept: 'Concept',
	subconcept: 'Subconcept',
	note: 'Note',
	paymentMethod: 'Method',
	income: 'Income',
	expense: 'Expense',
	balance: 'Balance',
	createdBy: 'Created by',
}

function entry(overrides: Partial<CashReportEntry> = {}): CashReportEntry {
	return {
		id: 1,
		date: new Date(2026, 2, 10, 14, 30),
		branchName: 'Centro',
		conceptName: 'Services',
		subconceptName: 'Repairs',
		note: '',
		paymentMethodId: 1,
		paymentMethodName: 'Cash',
		income: 1500.5,
		expense: 0,
		balance: 1500.5,
		createdBy: 'clerk',
		...overrides,
	}
}

describe('toCashReportCsv', () => {
	it('should emit only the header row for an empty report', () => {
		expect(toCashReportCsv([], headers)).toBe(
			'ID,Date,Branch,Concept,Subconcept,Note,Method,Income,Expense,Balance,Created by',
		)
	})

	it('should emit one row per entry with plain decimal amounts', () => {
		const csv = toCashReportCsv([entry()], headers)

		expect(csv.split('\r\n')[1]).toBe('1,2026-03-10 14:30,Centro,Services,Repairs,,Cash,1500.5,0,1500.5,clerk')
	})

	it('should neutralise text cells that a spreadsheet would evaluate as formulas', () => {
		expect(toCashReportCsv([entry({ note: '=HYPERLINK("http://evil")' })], headers)).toContain("'=HYPERLINK")
	})

	it('should quote cells with commas, quotes and line breaks', () => {
		const csv = toCashReportCsv([entry({ note: 'Said "ok", twice\nnext line' })], headers)

		expect(csv).toContain('"Said ""ok"", twice\nnext line"')
	})

	it('should keep the entry order', () => {
		const csv = toCashReportCsv([entry({ id: 2 }), entry({ id: 1 })], headers)

		expect(
			csv
				.split('\r\n')
				.slice(1)
				.map((row) => row.split(',')[0]),
		).toEqual(['2', '1'])
	})
})
