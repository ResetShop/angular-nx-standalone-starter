import type { CashReportTransactionDto } from '@contracts/report/cash-report.types'
import { TransactionTypeId } from '@domain/cash-concept/cash-concept.constants'
import type { CashReportEntry } from './cash-report.interface'

function parseAmount(raw: string): number {
	const amount = Number.parseFloat(raw)
	return Number.isFinite(amount) ? amount : 0
}

function mapEntry(dto: CashReportTransactionDto): CashReportEntry {
	const isIncome = dto.concept.transactionType.id === TransactionTypeId.INCOME
	const amount = parseAmount(dto.amount)
	const parent = dto.concept.parent
	return {
		id: dto.id,
		date: new Date(dto.date),
		branchName: dto.officeBranch?.name ?? '',
		conceptName: parent?.description ?? dto.concept.description,
		subconceptName: parent ? dto.concept.description : '',
		note: dto.note ?? '',
		paymentMethodId: dto.paymentMethod.id,
		paymentMethodName: dto.paymentMethod.description,
		income: isIncome ? amount : 0,
		expense: isIncome ? 0 : amount,
		balance: isIncome ? amount : -amount,
		createdBy: dto.audit?.createdBy?.userName ?? '',
	}
}

/**
 * Maps the transactions of `GET /cash` to report entries ordered by id, dropping the
 * cash-register opening/closing markers.
 */
export function mapCashReportEntries(dtos: readonly CashReportTransactionDto[]): CashReportEntry[] {
	// Concepts that only mark the opening and closing of the cash register move no money.
	const registerMarkerConceptIds: readonly number[] = [49, 163]
	return dtos
		.filter((dto) => !registerMarkerConceptIds.includes(dto.concept.id))
		.map(mapEntry)
		.sort((left, right) => left.id - right.id)
}
