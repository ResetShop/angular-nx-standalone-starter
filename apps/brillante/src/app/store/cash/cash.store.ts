import { computed, inject } from '@angular/core'
import type { CashTransactionQuery } from '@contracts/cash/cash-transaction.types'
import { rangeIncludesDay } from '@domain/cash/cash-date'
import { type CashTransactionDraft, toCashActor, toCashTransactionRequest } from '@domain/cash/cash-request.mapper'
import { summarizeTransactions } from '@domain/cash/cash-totals'
import { toCashTransaction } from '@domain/cash/cash-transaction.mapper'
import type { CashTransaction } from '@domain/cash/cash-transaction.model'
import { selectAssignableConcepts } from '@domain/cash/concept-options'
import { toPaymentMethod } from '@domain/cash/payment-method.model'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { CashConceptApi } from '@providers/cash-concept/cash-concept.interface'
import { CashApi } from '@providers/cash/cash.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import type { AppTranslationKey } from '@providers/i18n/app-translations'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { AuthStore } from '@store/auth/auth.store'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { startOfDay } from 'date-fns'
import { catchError, EMPTY, map, pipe, switchMap, tap } from 'rxjs'
import type { CashMutationError, CashReadError } from './cash.types'
import { createInitialCashState } from './cash.types'

type MutationFlag = 'isCreating' | 'isUpdating' | 'isDeleting' | 'isOpening' | 'isClosing'

function patchReadError(current: CashReadError, key: keyof CashReadError, value: string | null): CashReadError {
	return { ...current, [key]: value }
}

function patchMutationError(
	current: CashMutationError,
	key: keyof CashMutationError,
	value: string | null,
): CashMutationError {
	return { ...current, [key]: value }
}

/**
 * CashStore - cash register of the current branch.
 *
 * Lists the transactions of a day range (today by default) for the branch assigned to this
 * device, exposes the totals of the period, and owns the create / update / delete / open / close
 * operations. Route-scoped: provide it together with `provideCash()`, `provideCashConcept()` and
 * `providePaymentMethod()` on the cash section route.
 */
export const CashStore = signalStore(
	{ providedIn: 'root' },
	withState(createInitialCashState),
	withComputed((store) => {
		const officeBranchStore = inject(OfficeBranchStore)

		return {
			totals: computed(() => summarizeTransactions(store.transactions())),
			assignableConcepts: computed(() => selectAssignableConcepts(store.concepts())),
			isAnyLoading: computed(
				() =>
					store.isLoadingList() ||
					store.isLoadingDetail() ||
					store.isLoadingConcepts() ||
					store.isLoadingPaymentMethods() ||
					store.isCreating() ||
					store.isUpdating() ||
					store.isDeleting() ||
					store.isOpening() ||
					store.isClosing(),
			),
			hasReadError: computed(() => Object.values(store.readError()).some((e) => e !== null)),
			hasMutationError: computed(() => Object.values(store.mutationError()).some((e) => e !== null)),
			isMutating: computed(
				() => store.isCreating() || store.isUpdating() || store.isDeleting() || store.isOpening() || store.isClosing(),
			),
			includesToday: computed(() => rangeIncludesDay(store.dateFrom(), store.dateTo())),
			listParams: computed((): CashTransactionQuery => ({
				from: store.dateFrom(),
				to: store.dateTo(),
				branchId: officeBranchStore.currentBranch()?.id,
			})),
		}
	}),
	withComputed((store) => ({
		/** An empty register on a range that includes today means it was not opened yet. */
		canOpenRegister: computed(() => store.includesToday() && store.transactions().length === 0),
		/** Transactions can only be registered on an opened register, i.e. one with movements today. */
		canOperateRegister: computed(() => store.includesToday() && store.transactions().length > 0),
	})),
	withMethods((store) => {
		const api = inject(CashApi)
		const conceptApi = inject(CashConceptApi)
		const paymentMethodApi = inject(PaymentMethodApi)
		const translation = inject(AppTranslation)
		const loggerService = inject(Logger)

		return {
			loadTransactions: rxMethod<CashTransactionQuery>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingList: true,
							readError: patchReadError(store.readError(), 'list', null),
						}),
					),
					switchMap((query) =>
						api.getAll(query).pipe(
							// Mapping runs before `tap` so a malformed row reaches the error handler instead of leaving the list loading forever.
							map((rows) => rows.map(toCashTransaction)),
							tap({
								next: (transactions) => {
									const selectedId = store.selectedTransaction()?.id
									patchState(store, {
										transactions,
										selectedTransaction: transactions.find((t) => t.id === selectedId) ?? store.selectedTransaction(),
										isLoadingList: false,
									})
								},
								error: (err) => {
									loggerService.error('CashStore', 'loadTransactions failed', err)
									patchState(store, {
										isLoadingList: false,
										readError: patchReadError(store.readError(), 'list', translation.instant('CASH.ERRORS.LOAD_LIST')),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			loadTransaction: rxMethod<number>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingDetail: true,
							selectedTransaction: null,
							readError: patchReadError(store.readError(), 'detail', null),
						}),
					),
					switchMap((id) =>
						api.getById(id).pipe(
							tap({
								next: (row) =>
									patchState(store, { selectedTransaction: toCashTransaction(row), isLoadingDetail: false }),
								error: (err) => {
									loggerService.error('CashStore', 'loadTransaction failed', err)
									patchState(store, {
										isLoadingDetail: false,
										readError: patchReadError(
											store.readError(),
											'detail',
											translation.instant('CASH.ERRORS.LOAD_DETAIL'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			loadConcepts: rxMethod<void>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingConcepts: true,
							readError: patchReadError(store.readError(), 'concepts', null),
						}),
					),
					switchMap(() =>
						conceptApi.getAll().pipe(
							tap({
								next: (concepts) => patchState(store, { concepts, isLoadingConcepts: false }),
								error: (err) => {
									loggerService.error('CashStore', 'loadConcepts failed', err)
									patchState(store, {
										isLoadingConcepts: false,
										readError: patchReadError(
											store.readError(),
											'concepts',
											translation.instant('CASH.ERRORS.LOAD_CONCEPTS'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			loadPaymentMethods: rxMethod<void>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingPaymentMethods: true,
							readError: patchReadError(store.readError(), 'paymentMethods', null),
						}),
					),
					switchMap(() =>
						paymentMethodApi.getAll().pipe(
							tap({
								next: (methods) =>
									patchState(store, { paymentMethods: methods.map(toPaymentMethod), isLoadingPaymentMethods: false }),
								error: (err) => {
									loggerService.error('CashStore', 'loadPaymentMethods failed', err)
									patchState(store, {
										isLoadingPaymentMethods: false,
										readError: patchReadError(
											store.readError(),
											'paymentMethods',
											translation.instant('CASH.ERRORS.LOAD_PAYMENT_METHODS'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			/** Lists the days from `from` to `to` (inclusive); a reversed range is swapped. */
			setDateRange(from: Date, to: Date): void {
				const [first, last] = from <= to ? [from, to] : [to, from]
				patchState(store, { dateFrom: startOfDay(first), dateTo: startOfDay(last), selectedTransaction: null })
			},

			setToday(): void {
				const today = startOfDay(new Date())
				patchState(store, { dateFrom: today, dateTo: today, selectedTransaction: null })
			},

			selectTransaction(transaction: CashTransaction | null): void {
				patchState(store, { selectedTransaction: transaction })
			},

			clearMutationError(key: keyof CashMutationError): void {
				patchState(store, { mutationError: patchMutationError(store.mutationError(), key, null) })
			},

			clearErrors(): void {
				patchState(store, {
					readError: { list: null, detail: null, concepts: null, paymentMethods: null },
					mutationError: { create: null, update: null, delete: null, open: null, close: null },
				})
			},
		}
	}),
	withMethods((store) => {
		const api = inject(CashApi)
		const authStore = inject(AuthStore)
		const officeBranchStore = inject(OfficeBranchStore)
		const translation = inject(AppTranslation)
		const loggerService = inject(Logger)

		function fail(key: keyof CashMutationError, flag: MutationFlag, messageKey: AppTranslationKey): void {
			patchState(store, {
				[flag]: false,
				mutationError: patchMutationError(store.mutationError(), key, translation.instant(messageKey)),
			})
		}

		function start(key: keyof CashMutationError, flag: MutationFlag): void {
			patchState(store, { [flag]: true, mutationError: patchMutationError(store.mutationError(), key, null) })
		}

		function settle(flag: MutationFlag): void {
			patchState(store, { [flag]: false })
			store.loadTransactions(store.listParams())
		}

		return {
			reload(): void {
				store.loadTransactions(store.listParams())
			},

			createTransaction: rxMethod<CashTransactionDraft>(
				pipe(
					tap(() => start('create', 'isCreating')),
					switchMap((draft) => {
						const user = authStore.currentUser()
						const branch = officeBranchStore.currentBranch()
						if (!user || !branch) {
							fail('create', 'isCreating', 'CASH.ERRORS.NO_BRANCH')
							return EMPTY
						}
						return api.create(toCashTransactionRequest(draft), toCashActor(user), branch).pipe(
							tap({
								next: () => settle('isCreating'),
								error: (err) => {
									loggerService.error('CashStore', 'createTransaction failed', err)
									fail('create', 'isCreating', 'CASH.ERRORS.CREATE')
								},
							}),
							catchError(() => EMPTY),
						)
					}),
				),
			),

			updateTransaction: rxMethod<CashTransactionDraft>(
				pipe(
					tap(() => start('update', 'isUpdating')),
					switchMap((draft) => {
						const user = authStore.currentUser()
						if (!user) {
							fail('update', 'isUpdating', 'CASH.ERRORS.UPDATE')
							return EMPTY
						}
						return api.update(toCashTransactionRequest(draft), toCashActor(user)).pipe(
							tap({
								next: () => settle('isUpdating'),
								error: (err) => {
									loggerService.error('CashStore', 'updateTransaction failed', err)
									fail('update', 'isUpdating', 'CASH.ERRORS.UPDATE')
								},
							}),
							catchError(() => EMPTY),
						)
					}),
				),
			),

			deleteTransaction: rxMethod<number>(
				pipe(
					tap(() => start('delete', 'isDeleting')),
					switchMap((id) =>
						api.remove(id).pipe(
							tap({
								next: () => {
									if (store.selectedTransaction()?.id === id) patchState(store, { selectedTransaction: null })
									settle('isDeleting')
								},
								error: (err) => {
									loggerService.error('CashStore', 'deleteTransaction failed', err)
									fail('delete', 'isDeleting', 'CASH.ERRORS.DELETE')
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			openRegister: rxMethod<void>(
				pipe(
					tap(() => start('open', 'isOpening')),
					switchMap(() => {
						const user = authStore.currentUser()
						const branch = officeBranchStore.currentBranch()
						if (!user || !branch) {
							fail('open', 'isOpening', 'CASH.ERRORS.NO_BRANCH')
							return EMPTY
						}
						return api.open(toCashActor(user), branch).pipe(
							tap({
								next: () => settle('isOpening'),
								error: (err) => {
									loggerService.error('CashStore', 'openRegister failed', err)
									fail('open', 'isOpening', 'CASH.ERRORS.OPEN')
								},
							}),
							catchError(() => EMPTY),
						)
					}),
				),
			),

			closeRegister: rxMethod<void>(
				pipe(
					tap(() => start('close', 'isClosing')),
					switchMap(() => {
						const branch = officeBranchStore.currentBranch()
						if (!branch) {
							fail('close', 'isClosing', 'CASH.ERRORS.NO_BRANCH')
							return EMPTY
						}
						return api.close(branch).pipe(
							tap({
								next: () => settle('isClosing'),
								error: (err) => {
									loggerService.error('CashStore', 'closeRegister failed', err)
									fail('close', 'isClosing', 'CASH.ERRORS.CLOSE')
								},
							}),
							catchError(() => EMPTY),
						)
					}),
				),
			),
		}
	}),
	withHooks({
		onInit(store) {
			store.loadConcepts()
			store.loadPaymentMethods()
			store.loadTransactions(store.listParams)
		},
	}),
)
