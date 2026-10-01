import { computed, inject } from '@angular/core'
import type { CreateOfficeBranchRequest, OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { OfficeBranchApi } from '@providers/office-branch/office-branch.interface'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs'
import type { OfficeBranchMutationError, OfficeBranchReadError } from './office-branch.types'
import { initialOfficeBranchState } from './office-branch.types'

/**
 * localStorage key of the branch assigned to this browser. Stays stable so the assignment made
 * in the previous version of the application keeps working.
 */
const CURRENT_BRANCH_STORAGE_KEY = 'officeBranch.current'

function patchReadError(
	current: OfficeBranchReadError,
	key: keyof OfficeBranchReadError,
	value: string | null,
): OfficeBranchReadError {
	return { ...current, [key]: value }
}

function patchMutationError(
	current: OfficeBranchMutationError,
	key: keyof OfficeBranchMutationError,
	value: string | null,
): OfficeBranchMutationError {
	return { ...current, [key]: value }
}

function readStoredBranch(): OfficeBranchDto | null {
	const raw = localStorage.getItem(CURRENT_BRANCH_STORAGE_KEY)
	if (!raw) return null
	try {
		return JSON.parse(raw) as OfficeBranchDto
	} catch {
		localStorage.removeItem(CURRENT_BRANCH_STORAGE_KEY)
		return null
	}
}

export const OfficeBranchStore = signalStore(
	{ providedIn: 'root' },
	withState(initialOfficeBranchState),
	withComputed((store) => ({
		hasCurrentBranch: computed(() => store.currentBranch() !== null),
		isAnyLoading: computed(() => store.isLoadingList() || store.isCreating()),
		hasReadError: computed(() => Object.values(store.readError()).some((e) => e !== null)),
		hasMutationError: computed(() => Object.values(store.mutationError()).some((e) => e !== null)),
	})),
	withMethods((store) => {
		const api = inject(OfficeBranchApi)
		const loggerService = inject(Logger)

		return {
			loadBranches: rxMethod<void>(
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
								next: (branches) => patchState(store, { branches, isLoadingList: false }),
								error: (err) => {
									loggerService.error('OfficeBranchStore', 'loadBranches failed', err)
									patchState(store, {
										isLoadingList: false,
										readError: patchReadError(store.readError(), 'list', 'Failed to load branches'),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			/**
			 * Assigns the branch to this browser and persists the choice.
			 */
			assign(branch: OfficeBranchDto): void {
				localStorage.setItem(CURRENT_BRANCH_STORAGE_KEY, JSON.stringify(branch))
				patchState(store, { currentBranch: branch })
			},

			clearErrors(): void {
				patchState(store, { readError: { list: null }, mutationError: { create: null } })
			},
		}
	}),
	withMethods((store) => {
		const api = inject(OfficeBranchApi)
		const loggerService = inject(Logger)

		return {
			reload(): void {
				store.loadBranches()
			},

			createBranch: rxMethod<CreateOfficeBranchRequest>(
				pipe(
					tap(() =>
						patchState(store, {
							isCreating: true,
							mutationError: patchMutationError(store.mutationError(), 'create', null),
						}),
					),
					switchMap((body) =>
						api.create(body).pipe(
							tap({
								next: () => {
									patchState(store, { isCreating: false })
									store.loadBranches()
								},
								error: (err) => {
									loggerService.error('OfficeBranchStore', 'createBranch failed', err)
									patchState(store, {
										isCreating: false,
										mutationError: patchMutationError(store.mutationError(), 'create', 'Failed to create branch'),
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
			patchState(store, { currentBranch: readStoredBranch() })
		},
	}),
)
