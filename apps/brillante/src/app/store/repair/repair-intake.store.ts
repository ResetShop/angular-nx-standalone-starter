import { computed, inject } from '@angular/core'
import {
	createRepairFromIntake,
	mapCustomerDto,
	toCreateCustomerRequest,
	toCreateRepairRequest,
} from '@domain/repair/repair.mapper'
import type { RepairIntake } from '@domain/repair/repair.model'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { CustomerApi } from '@providers/customer/customer.interface'
import { RepairApi } from '@providers/repair/repair.interface'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { extractErrorMessage } from '@resetshop/angular-core/store/extract-error-message'
import { AuthStore } from '@store/auth/auth.store'
import { catchError, EMPTY, map, type Observable, of, pipe, switchMap, tap, throwError } from 'rxjs'
import { initialRepairIntakeState } from './repair-intake.types'
import { RepairStore } from './repair.store'

/**
 * RepairIntakeStore - Signal Store for opening a new repair
 *
 * Covers the two steps of the intake form: looking the customer up by DNI and creating the
 * repair, registering the customer first when the DNI is not known yet. A successful creation
 * reloads the repair list so it is current when the user goes back to it.
 */
export const RepairIntakeStore = signalStore(
	{ providedIn: 'root' },
	withState(initialRepairIntakeState),
	withComputed((store) => ({
		customerExists: computed(() => store.lookupStatus() === 'found'),
		isLookingUp: computed(() => store.lookupStatus() === 'loading'),
		hasMutationError: computed(() => Object.values(store.mutationError()).some((e) => e !== null)),
	})),
	withMethods((store) => {
		const customerApi = inject(CustomerApi)
		const loggerService = inject(Logger)

		return {
			lookupCustomer: rxMethod<number>(
				pipe(
					tap(() => patchState(store, { lookupStatus: 'loading', readError: { lookup: null } })),
					switchMap((dni) =>
						customerApi.getByDni(dni).pipe(
							// Mapping runs before `tap` so a malformed customer reaches the error handler instead of leaving the lookup loading forever.
							map((customer) => (customer ? mapCustomerDto(customer) : null)),
							tap({
								next: (customer) =>
									patchState(store, {
										lookupStatus: customer ? 'found' : 'not-found',
										customer,
									}),
								error: (err) => {
									loggerService.error('RepairIntakeStore', 'lookupCustomer failed', err)
									patchState(store, {
										lookupStatus: 'idle',
										readError: { lookup: 'Failed to look the customer up' },
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			clearCustomer(): void {
				patchState(store, { lookupStatus: 'idle', customer: null, readError: { lookup: null } })
			},

			clearMutationError(): void {
				patchState(store, { mutationError: { create: null } })
			},

			reset(): void {
				patchState(store, initialRepairIntakeState)
			},
		}
	}),
	withMethods((store) => {
		const customerApi = inject(CustomerApi)
		const repairApi = inject(RepairApi)
		const authStore = inject(AuthStore)
		const repairStore = inject(RepairStore)
		const loggerService = inject(Logger)

		/** Resolves the id of the customer the repair belongs to, registering the customer when it is new. */
		function resolveCustomerId(intake: RepairIntake): Observable<number> {
			if (intake.customer.id !== null) return of(intake.customer.id)
			return customerApi.create(toCreateCustomerRequest(intake.customer)).pipe(
				map(([customer]) => {
					if (!customer?.id) throw new Error('The customer could not be registered')
					return customer.id
				}),
			)
		}

		return {
			createRepair: rxMethod<RepairIntake>(
				pipe(
					tap(() => patchState(store, { isCreating: true, createdRepairId: null, mutationError: { create: null } })),
					switchMap((intake) => {
						const user = authStore.currentUser()
						const created$ = user
							? resolveCustomerId(intake).pipe(
									switchMap((customerId) =>
										repairApi.create(toCreateRepairRequest(createRepairFromIntake(intake, customerId), user)),
									),
								)
							: throwError(() => new Error('No authenticated user'))
						return created$.pipe(
							tap((created) => {
								if (!created?.id) throw new Error('The API did not return the created repair')
							}),
							tap({
								next: (created) => {
									patchState(store, { isCreating: false, createdRepairId: created.id ?? null })
									repairStore.reload()
								},
								error: (err) => {
									loggerService.error('RepairIntakeStore', 'createRepair failed', err)
									patchState(store, {
										isCreating: false,
										mutationError: { create: extractErrorMessage(err, 'Failed to create the repair') },
									})
								},
							}),
							catchError(() => EMPTY),
						)
					}),
				),
			),
		}
	}),
)
