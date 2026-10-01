import { computed, inject } from '@angular/core'
import {
	mapRepairDto,
	mapRepairStatusHistoryDto,
	toRepairWriteDto,
	toUpdateTrackingInfoRequest,
} from '@domain/repair/repair.mapper'
import type { Repair, RepairStatusEntry } from '@domain/repair/repair.model'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { extractErrorMessage } from '@resetshop/angular-core/store/extract-error-message'
import { parseDurationToMs } from '@resetshop/util'
import { AuthStore } from '@store/auth/auth.store'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { catchError, debounceTime, EMPTY, pipe, switchMap, tap, throwError } from 'rxjs'
import { SEARCH_DEBOUNCE_DELAY } from '../../../store/store.constants'
import { RepairApi } from './repair.interface'
import type { RepairListParams, RepairMutationError, RepairReadError } from './repair.types'
import { initialRepairMutationError, initialRepairReadError, initialRepairState } from './repair.types'

function patchReadError(current: RepairReadError, key: keyof RepairReadError, value: string | null): RepairReadError {
	return { ...current, [key]: value }
}

function patchMutationError(
	current: RepairMutationError,
	key: keyof RepairMutationError,
	value: string | null,
): RepairMutationError {
	return { ...current, [key]: value }
}

function newestFirst(entries: RepairStatusEntry[]): RepairStatusEntry[] {
	return [...entries].sort((a, b) => (b.changedAt?.getTime() ?? 0) - (a.changedAt?.getTime() ?? 0))
}

function mostRecentlyUpdatedFirst(repairs: Repair[]): Repair[] {
	return [...repairs].sort((a, b) => (b.lastUpdate?.getTime() ?? 0) - (a.lastUpdate?.getTime() ?? 0))
}

function matchesSearch(repair: Repair, query: string): boolean {
	const haystack = [
		repair.id,
		repair.customer.fullName,
		repair.device.manufacturer,
		repair.device.model,
		repair.device.deviceId,
	]
		.join(' ')
		.toLowerCase()
	return haystack.includes(query.toLowerCase())
}

/**
 * RepairStore - Signal Store for the repairs section
 *
 * The API returns the whole repair list for the chosen filters (`showFinished` and an optional
 * date range), so status filtering, search and pagination happen on the client. The list load is
 * reactive: changing `listParams` re-fetches. The catalogues the forms need (repair statuses and
 * payment methods) load once when the store is created.
 */
export const RepairStore = signalStore(
	{ providedIn: 'root' },
	withState(initialRepairState),
	withComputed((store) => ({
		isAnyLoading: computed(
			() =>
				store.isLoadingList() ||
				store.isLoadingDetail() ||
				store.isLoadingHistory() ||
				store.isUpdatingDevice() ||
				store.isUpdatingTracking() ||
				store.isDeleting(),
		),
		hasReadError: computed(() => Object.values(store.readError()).some((e) => e !== null)),
		hasMutationError: computed(() => Object.values(store.mutationError()).some((e) => e !== null)),
		isMutating: computed(() => store.isUpdatingDevice() || store.isUpdatingTracking() || store.isDeleting()),
		/** Reactive params for the list fetch — any change triggers loadRepairs via rxMethod */
		listParams: computed((): RepairListParams => ({
			showFinished: store.showFinished(),
			dateFrom: store.dateFrom(),
			dateTo: store.dateTo(),
		})),
		filteredRepairs: computed(() => {
			const statusFilter = store.statusFilter()
			const query = store.searchQuery().trim()
			return store
				.repairs()
				.filter((repair) => statusFilter === null || repair.status.id === statusFilter)
				.filter((repair) => query === '' || matchesSearch(repair, query))
		}),
	})),
	withComputed((store) => ({
		totalItems: computed(() => store.filteredRepairs().length),
		totalPages: computed(() => Math.ceil(store.filteredRepairs().length / store.pageSize())),
	})),
	withComputed((store) => ({
		/** The requested page, clamped so deleting the last row of the last page never leaves an empty page. */
		activePage: computed(() => Math.max(1, Math.min(store.currentPage(), store.totalPages()))),
	})),
	withComputed((store) => ({
		pagedRepairs: computed(() => {
			const start = (store.activePage() - 1) * store.pageSize()
			return store.filteredRepairs().slice(start, start + store.pageSize())
		}),
	})),
	withMethods((store) => {
		const repairApi = inject(RepairApi)
		const paymentMethodApi = inject(PaymentMethodApi)
		const loggerService = inject(Logger)

		return {
			loadRepairs: rxMethod<RepairListParams>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingList: true,
							readError: patchReadError(store.readError(), 'list', null),
						}),
					),
					switchMap(({ showFinished, dateFrom, dateTo }) =>
						(dateFrom && dateTo
							? repairApi.getAllByDate({ dateFrom, dateTo, showFinished })
							: repairApi.getAll(showFinished)
						).pipe(
							tap({
								next: (repairs) =>
									patchState(store, {
										repairs: mostRecentlyUpdatedFirst(repairs.map(mapRepairDto)),
										isLoadingList: false,
									}),
								error: (err) => {
									loggerService.error('RepairStore', 'loadRepairs failed', err)
									patchState(store, {
										isLoadingList: false,
										readError: patchReadError(store.readError(), 'list', 'Failed to load repairs'),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			loadRepair: rxMethod<number>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingDetail: true,
							readError: patchReadError(store.readError(), 'detail', null),
						}),
					),
					switchMap((id) =>
						repairApi.getById(id).pipe(
							tap({
								next: (repair) => patchState(store, { selectedRepair: mapRepairDto(repair), isLoadingDetail: false }),
								error: (err) => {
									loggerService.error('RepairStore', 'loadRepair failed', err)
									patchState(store, {
										isLoadingDetail: false,
										readError: patchReadError(store.readError(), 'detail', 'Failed to load repair'),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			loadHistory: rxMethod<number>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingHistory: true,
							readError: patchReadError(store.readError(), 'history', null),
						}),
					),
					switchMap((id) =>
						repairApi.getHistory(id).pipe(
							tap({
								next: (history) =>
									patchState(store, {
										history: newestFirst(history.map(mapRepairStatusHistoryDto)),
										isLoadingHistory: false,
									}),
								error: (err) => {
									loggerService.error('RepairStore', 'loadHistory failed', err)
									patchState(store, {
										isLoadingHistory: false,
										readError: patchReadError(store.readError(), 'history', 'Failed to load repair history'),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			loadStatuses: rxMethod<void>(
				pipe(
					tap(() => patchState(store, { readError: patchReadError(store.readError(), 'statuses', null) })),
					switchMap(() =>
						repairApi.getStatuses().pipe(
							tap({
								next: (statuses) => patchState(store, { statuses }),
								error: (err) => {
									loggerService.error('RepairStore', 'loadStatuses failed', err)
									patchState(store, {
										readError: patchReadError(store.readError(), 'statuses', 'Failed to load repair statuses'),
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
					tap(() => patchState(store, { readError: patchReadError(store.readError(), 'paymentMethods', null) })),
					switchMap(() =>
						paymentMethodApi.getAll().pipe(
							tap({
								next: (paymentMethods) => patchState(store, { paymentMethods }),
								error: (err) => {
									loggerService.error('RepairStore', 'loadPaymentMethods failed', err)
									patchState(store, {
										readError: patchReadError(store.readError(), 'paymentMethods', 'Failed to load payment methods'),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			setPage(page: number): void {
				patchState(store, { currentPage: page })
			},

			setPageSize(size: number): void {
				patchState(store, { pageSize: size, currentPage: 1 })
			},

			setSearchQuery: rxMethod<string>(
				pipe(
					debounceTime(parseDurationToMs(SEARCH_DEBOUNCE_DELAY)),
					tap((query: string) => patchState(store, { searchQuery: query, currentPage: 1 })),
				),
			),

			setStatusFilter(statusId: number | null): void {
				patchState(store, { statusFilter: statusId, currentPage: 1 })
			},

			setShowFinished(showFinished: boolean): void {
				patchState(store, { showFinished, currentPage: 1 })
			},

			setDateRange(dateFrom: Date | null, dateTo: Date | null): void {
				patchState(store, { dateFrom, dateTo, currentPage: 1 })
			},

			selectRepair(repair: Repair | null): void {
				patchState(store, { selectedRepair: repair, history: [] })
			},

			clearMutationError(key: keyof RepairMutationError): void {
				patchState(store, { mutationError: patchMutationError(store.mutationError(), key, null) })
			},

			clearErrors(): void {
				patchState(store, { readError: initialRepairReadError, mutationError: initialRepairMutationError })
			},
		}
	}),
	// Mutation methods — all reload the affected data after success
	withMethods((store) => {
		const repairApi = inject(RepairApi)
		const authStore = inject(AuthStore)
		const officeBranchStore = inject(OfficeBranchStore)
		const loggerService = inject(Logger)

		function refreshAfterMutation(id: number | null): void {
			if (id !== null) {
				store.loadRepair(id)
				store.loadHistory(id)
			}
			store.loadRepairs(store.listParams())
		}

		return {
			reload(): void {
				store.loadRepairs(store.listParams())
			},

			updateDeviceInfo: rxMethod<Repair>(
				pipe(
					tap(() =>
						patchState(store, {
							isUpdatingDevice: true,
							mutationError: patchMutationError(store.mutationError(), 'updateDevice', null),
						}),
					),
					switchMap((repair) =>
						repairApi.updateDeviceInfo(toRepairWriteDto(repair)).pipe(
							tap((result) => {
								if (!result) throw new Error('The API did not confirm the device update')
							}),
							tap({
								next: () => {
									patchState(store, { isUpdatingDevice: false })
									refreshAfterMutation(repair.id)
								},
								error: (err) => {
									loggerService.error('RepairStore', 'updateDeviceInfo failed', err)
									patchState(store, {
										isUpdatingDevice: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'updateDevice',
											extractErrorMessage(err, 'Failed to update the device information'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			updateTrackingInfo: rxMethod<{ repair: Repair; generateTransaction: boolean }>(
				pipe(
					tap(() =>
						patchState(store, {
							isUpdatingTracking: true,
							mutationError: patchMutationError(store.mutationError(), 'updateTracking', null),
						}),
					),
					switchMap(({ repair, generateTransaction }) => {
						const user = authStore.currentUser()
						const request$ = user
							? repairApi.updateTrackingInfo(
									toUpdateTrackingInfoRequest(repair, user, generateTransaction, officeBranchStore.currentBranch()),
								)
							: throwError(() => new Error('No authenticated user'))
						return request$.pipe(
							tap((result) => {
								if (!result?.[0]) throw new Error('The API did not confirm the tracking update')
							}),
							tap({
								next: () => {
									patchState(store, { isUpdatingTracking: false })
									refreshAfterMutation(repair.id)
								},
								error: (err) => {
									loggerService.error('RepairStore', 'updateTrackingInfo failed', err)
									patchState(store, {
										isUpdatingTracking: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'updateTracking',
											extractErrorMessage(err, 'Failed to update the repair'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						)
					}),
				),
			),

			deleteRepair: rxMethod<number>(
				pipe(
					tap(() =>
						patchState(store, {
							isDeleting: true,
							mutationError: patchMutationError(store.mutationError(), 'delete', null),
						}),
					),
					switchMap((id) =>
						repairApi.delete(id).pipe(
							tap({
								next: () => {
									if (store.selectedRepair()?.id === id) {
										patchState(store, { selectedRepair: null, history: [] })
									}
									patchState(store, { isDeleting: false })
									store.loadRepairs(store.listParams())
								},
								error: (err) => {
									loggerService.error('RepairStore', 'deleteRepair failed', err)
									patchState(store, {
										isDeleting: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'delete',
											extractErrorMessage(err, 'Failed to delete the repair'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),
		}
	}),
	withHooks({
		onInit(store) {
			// Pass the computed listParams signal — rxMethod watches it and re-fires on any change
			store.loadRepairs(store.listParams)
			store.loadStatuses()
			store.loadPaymentMethods()
		},
	}),
)
