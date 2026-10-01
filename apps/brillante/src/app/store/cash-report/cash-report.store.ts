import { computed, inject } from '@angular/core'
import type { CashReportRequest } from '@contracts/report/cash-report.types'
import { mapCashReportEntries } from '@domain/report/cash-report.mapper'
import { summarizeCashReport } from '@domain/report/cash-report.summary'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { AppTranslation } from '@providers/i18n/app-translation'
import { ReportApi } from '@providers/report/report.interface'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs'
import type { CashReportReadError } from './cash-report.types'
import { initialCashReportState } from './cash-report.types'

function patchReadError(
	current: CashReportReadError,
	key: keyof CashReportReadError,
	value: string | null,
): CashReportReadError {
	return { ...current, [key]: value }
}

/**
 * Cash report of a period: the cash transactions of the requested days (and branch) mapped to
 * report entries, with the totals and breakdowns derived from them. Nothing is loaded until a
 * report is requested with `generate`.
 */
export const CashReportStore = signalStore(
	{ providedIn: 'root' },
	withState(initialCashReportState),
	withComputed((store) => ({
		hasReadError: computed(() => Object.values(store.readError()).some((e) => e !== null)),
		hasGenerated: computed(() => store.request() !== null),
		summary: computed(() => summarizeCashReport(store.entries())),
	})),
	withMethods((store) => {
		const api = inject(ReportApi)
		const loggerService = inject(Logger)
		const translation = inject(AppTranslation)

		return {
			generate: rxMethod<CashReportRequest>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingList: true,
							readError: patchReadError(store.readError(), 'list', null),
						}),
					),
					switchMap((request) =>
						api.getCashTransactions(request).pipe(
							tap({
								next: (transactions) =>
									patchState(store, { entries: mapCashReportEntries(transactions), request, isLoadingList: false }),
								error: (err) => {
									loggerService.error('CashReportStore', 'generate failed', err)
									patchState(store, {
										entries: [],
										request: null,
										isLoadingList: false,
										readError: patchReadError(
											store.readError(),
											'list',
											translation.instant('REPORTS.CASH.ERRORS.LOAD'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			clearErrors(): void {
				patchState(store, { readError: { list: null } })
			},
		}
	}),
	withMethods((store) => ({
		reload(): void {
			const request = store.request()
			if (request) {
				store.generate(request)
			}
		},
	})),
)
