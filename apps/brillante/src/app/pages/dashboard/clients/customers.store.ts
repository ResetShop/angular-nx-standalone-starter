import { computed, inject } from '@angular/core'
import type { CustomerDto } from '@contracts/client/client.types'
import type { PaginatedRows, SearchPaginationParams } from '@contracts/common/legacy-pagination.types'
import type { CustomerDetails } from '@domain/customer/customer.interface'
import {
	mapCustomerDtoToCustomer,
	mapCustomerToCreateRequest,
	mapCustomerToUpdateRequest,
} from '@domain/customer/customer.mapper'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { CustomerApi } from '@providers/customer/customer.interface'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { extractErrorMessage } from '@resetshop/angular-core/store/extract-error-message'
import { parseDurationToMs } from '@resetshop/util'
import { catchError, debounceTime, EMPTY, map, type Observable, of, pipe, switchMap, tap } from 'rxjs'
import { SEARCH_DEBOUNCE_DELAY } from '../../../store/store.constants'
import type { CustomersMutationError, CustomersReadError } from './customers.types'
import { initialCustomersState } from './customers.types'

function patchReadError(
	current: CustomersReadError,
	key: keyof CustomersReadError,
	value: string | null,
): CustomersReadError {
	return { ...current, [key]: value }
}

function patchMutationError(
	current: CustomersMutationError,
	key: keyof CustomersMutationError,
	value: string | null,
): CustomersMutationError {
	return { ...current, [key]: value }
}

function singleRow(customer: CustomerDto | null): PaginatedRows<CustomerDto> {
	return customer ? { count: 1, rows: [customer] } : { count: 0, rows: [] }
}

/**
 * The customers endpoint only paginates the unfiltered list. A search term is therefore resolved
 * with the exact-match lookups the API offers: all digits is a DNI, anything with an `@` is an
 * email, and any other text cannot match a customer.
 */
function fetchPage(
	api: CustomerApi,
	{ offset, limit, search }: SearchPaginationParams,
): Observable<PaginatedRows<CustomerDto>> {
	const term = search?.trim()
	if (!term) return api.getAll(offset, limit)
	if (/^\d+$/.test(term)) return api.getByDni(Number(term)).pipe(map(singleRow))
	if (term.includes('@')) return api.getByEmail(term).pipe(map(singleRow))
	return of(singleRow(null))
}

/**
 * CustomersStore - Signal Store for the clients module.
 *
 * The list load is reactive: changing currentPage, pageSize or searchQuery re-fetches through the
 * computed listParams signal. Mutations reload the current page from the server afterwards.
 */
export const CustomersStore = signalStore(
	{ providedIn: 'root' },
	withState(initialCustomersState),
	withComputed((store) => ({
		totalPages: computed(() => (store.totalItems() === 0 ? 0 : Math.ceil(store.totalItems() / store.pageSize()))),
		isAnyLoading: computed(() => store.isLoadingList() || store.isCreating() || store.isUpdating()),
		hasReadError: computed(() => Object.values(store.readError()).some((e) => e !== null)),
		hasMutationError: computed(() => Object.values(store.mutationError()).some((e) => e !== null)),
		isMutating: computed(() => store.isCreating() || store.isUpdating()),
		listParams: computed(() => ({
			offset: (store.currentPage() - 1) * store.pageSize(),
			limit: store.pageSize(),
			search: store.searchQuery() || undefined,
		})),
	})),
	withComputed((store) => ({
		hasNextPage: computed(() => store.currentPage() < store.totalPages()),
		hasPreviousPage: computed(() => store.currentPage() > 1),
	})),
	withMethods((store) => {
		const api = inject(CustomerApi)
		const loggerService = inject(Logger)

		return {
			loadCustomers: rxMethod<SearchPaginationParams>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingList: true,
							readError: patchReadError(store.readError(), 'list', null),
						}),
					),
					switchMap((params) =>
						fetchPage(api, params).pipe(
							tap({
								next: (response) =>
									patchState(store, {
										customers: response.rows.map(mapCustomerDtoToCustomer),
										totalItems: response.count,
										isLoadingList: false,
									}),
								error: (err) => {
									loggerService.error('CustomersStore', 'loadCustomers failed', err)
									patchState(store, {
										isLoadingList: false,
										readError: patchReadError(store.readError(), 'list', 'Failed to load customers'),
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
					tap((query: string) => patchState(store, { searchQuery: query.trim(), currentPage: 1 })),
				),
			),

			clearMutationError(key: keyof CustomersMutationError): void {
				patchState(store, { mutationError: patchMutationError(store.mutationError(), key, null) })
			},

			clearErrors(): void {
				patchState(store, {
					readError: { list: null },
					mutationError: { create: null, update: null },
					createOutcome: null,
				})
			},
		}
	}),
	withMethods((store) => {
		const api = inject(CustomerApi)
		const loggerService = inject(Logger)

		return {
			reload(): void {
				store.loadCustomers(store.listParams())
			},

			createCustomer: rxMethod<CustomerDetails>(
				pipe(
					tap(() =>
						patchState(store, {
							isCreating: true,
							createOutcome: null,
							mutationError: patchMutationError(store.mutationError(), 'create', null),
						}),
					),
					switchMap((details) =>
						api.create(mapCustomerToCreateRequest(details)).pipe(
							tap({
								next: ([, created]) => {
									patchState(store, { isCreating: false, createOutcome: created ? 'created' : 'existing' })
									store.loadCustomers(store.listParams())
								},
								error: (err) => {
									loggerService.error('CustomersStore', 'createCustomer failed', err)
									patchState(store, {
										isCreating: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'create',
											extractErrorMessage(err, 'Failed to create customer'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			updateCustomer: rxMethod<CustomerDetails & { id: number }>(
				pipe(
					tap(() =>
						patchState(store, {
							isUpdating: true,
							mutationError: patchMutationError(store.mutationError(), 'update', null),
						}),
					),
					switchMap((customer) =>
						api.update(mapCustomerToUpdateRequest(customer)).pipe(
							tap({
								next: () => {
									patchState(store, { isUpdating: false })
									store.loadCustomers(store.listParams())
								},
								error: (err) => {
									loggerService.error('CustomersStore', 'updateCustomer failed', err)
									patchState(store, {
										isUpdating: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'update',
											extractErrorMessage(err, 'Failed to update customer'),
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
			store.loadCustomers(store.listParams)
		},
	}),
)
