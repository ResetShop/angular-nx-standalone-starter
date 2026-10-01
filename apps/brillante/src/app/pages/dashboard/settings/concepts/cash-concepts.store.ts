import { computed, inject } from '@angular/core'
import type { CashConceptChanges, CashConceptDraft } from '@domain/cash-concept/cash-concept.interface'
import {
	findConceptDto,
	flattenManagedConcepts,
	mapConceptTree,
	toCreateConceptRequest,
	toUpdateConceptRequest,
} from '@domain/cash-concept/cash-concept.mapper'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { CashConceptApi } from '@providers/cash-concept/cash-concept.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { catchError, EMPTY, type Observable, pipe, switchMap, tap } from 'rxjs'
import type { CashConceptsMutationError, CashConceptsReadError } from './cash-concepts.types'
import { initialCashConceptsState } from './cash-concepts.types'

export interface CashConceptStatusChange {
	id: number
	enabled: boolean
}

type MutationKey = keyof CashConceptsMutationError

function patchReadError(
	current: CashConceptsReadError,
	key: keyof CashConceptsReadError,
	value: string | null,
): CashConceptsReadError {
	return { ...current, [key]: value }
}

function patchMutationError(
	current: CashConceptsMutationError,
	key: MutationKey,
	value: string | null,
): CashConceptsMutationError {
	return { ...current, [key]: value }
}

/**
 * Cash concept tree managed from the settings area. The API returns the whole tree at once, so
 * the store keeps it as received and derives the concept list, the table rows and the type
 * filter from it.
 */
export const CashConceptsStore = signalStore(
	{ providedIn: 'root' },
	withState(initialCashConceptsState),
	withComputed((store) => ({
		isAnyLoading: computed(
			() => store.isLoadingList() || store.isCreating() || store.isUpdating() || store.isChangingStatus(),
		),
		hasReadError: computed(() => Object.values(store.readError()).some((e) => e !== null)),
		hasMutationError: computed(() => Object.values(store.mutationError()).some((e) => e !== null)),
		isMutating: computed(() => store.isCreating() || store.isUpdating() || store.isChangingStatus()),
		concepts: computed(() => mapConceptTree(store.tree())),
	})),
	withComputed((store) => ({
		/** Table rows: the managed concepts of the selected transaction type. */
		rows: computed(() => {
			const typeFilter = store.typeFilter()
			const concepts = store.concepts()
			return flattenManagedConcepts(
				typeFilter === null ? concepts : concepts.filter((concept) => concept.transactionTypeId === typeFilter),
			)
		}),
		/** Top level concepts a subconcept can be created under. */
		parentCandidates: computed(() => store.concepts().filter((concept) => concept.userAssignable)),
	})),
	withMethods((store) => {
		const api = inject(CashConceptApi)
		const loggerService = inject(Logger)
		const translation = inject(AppTranslation)

		return {
			loadConcepts: rxMethod<void>(
				pipe(
					tap(() =>
						patchState(store, {
							isLoadingList: true,
							readError: patchReadError(store.readError(), 'list', null),
						}),
					),
					switchMap(() =>
						api.getAll().pipe(
							tap({
								next: (tree) => patchState(store, { tree, isLoadingList: false }),
								error: (err) => {
									loggerService.error('CashConceptsStore', 'loadConcepts failed', err)
									patchState(store, {
										isLoadingList: false,
										readError: patchReadError(
											store.readError(),
											'list',
											translation.instant('CASH_CONCEPTS.ERRORS.LOAD'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			setTypeFilter(typeFilter: number | null): void {
				patchState(store, { typeFilter })
			},

			clearMutationError(key: MutationKey): void {
				patchState(store, { mutationError: patchMutationError(store.mutationError(), key, null) })
			},

			clearErrors(): void {
				patchState(store, {
					readError: { list: null },
					mutationError: { create: null, update: null, setEnabled: null },
				})
			},
		}
	}),
	withMethods((store) => {
		const api = inject(CashConceptApi)
		const loggerService = inject(Logger)
		const translation = inject(AppTranslation)

		// Loading flag of the state that each mutation toggles while its request is in flight.
		const LOADING_KEY = {
			create: 'isCreating',
			update: 'isUpdating',
			setEnabled: 'isChangingStatus',
		} as const satisfies Record<MutationKey, 'isCreating' | 'isUpdating' | 'isChangingStatus'>

		const begin = (operation: MutationKey): void =>
			patchState(store, {
				[LOADING_KEY[operation]]: true,
				mutationError: patchMutationError(store.mutationError(), operation, null),
			})

		const fail = (operation: MutationKey, message: string, err: unknown): void => {
			loggerService.error('CashConceptsStore', `${operation} failed`, err)
			patchState(store, {
				[LOADING_KEY[operation]]: false,
				mutationError: patchMutationError(store.mutationError(), operation, message),
			})
		}

		const run = (operation: MutationKey, message: string, request$: Observable<unknown>): Observable<unknown> =>
			request$.pipe(
				tap({
					next: () => {
						patchState(store, { [LOADING_KEY[operation]]: false })
						store.loadConcepts()
					},
					error: (err) => fail(operation, message, err),
				}),
				catchError(() => EMPTY),
			)

		return {
			reload(): void {
				store.loadConcepts()
			},

			createConcept: rxMethod<CashConceptDraft>(
				pipe(
					tap(() => begin('create')),
					switchMap((draft) => {
						const parent = draft.parentId === null ? null : findConceptDto(store.tree(), draft.parentId)
						return run(
							'create',
							translation.instant('CASH_CONCEPTS.ERRORS.CREATE'),
							api.create(toCreateConceptRequest(draft, parent)),
						)
					}),
				),
			),

			updateConcept: rxMethod<CashConceptChanges>(
				pipe(
					tap(() => begin('update')),
					switchMap((changes) => {
						const message = translation.instant('CASH_CONCEPTS.ERRORS.UPDATE')
						const current = findConceptDto(store.tree(), changes.id)
						if (!current) {
							fail('update', message, new Error(`Concept ${changes.id} not found`))
							return EMPTY
						}
						return run('update', message, api.update(toUpdateConceptRequest(current, changes)))
					}),
				),
			),

			setConceptEnabled: rxMethod<CashConceptStatusChange>(
				pipe(
					tap(() => begin('setEnabled')),
					switchMap(({ id, enabled }) => {
						const message = translation.instant('CASH_CONCEPTS.ERRORS.SET_ENABLED')
						const current = findConceptDto(store.tree(), id)
						if (!current) {
							fail('setEnabled', message, new Error(`Concept ${id} not found`))
							return EMPTY
						}
						return run('setEnabled', message, enabled ? api.enable(current) : api.disable(current))
					}),
				),
			),
		}
	}),
	withHooks({
		onInit(store) {
			store.loadConcepts()
		},
	}),
)
