import { inject } from '@angular/core'
import type { CustomerDto } from '@contracts/client/client.types'
import type { UserDto } from '@contracts/user/legacy-user.types'
import type { CustomerDetails } from '@domain/customer/customer.interface'
import { mapCustomerDtoToCustomer, mapCustomerToDto } from '@domain/customer/customer.mapper'
import { Customer } from '@domain/customer/customer.model'
import type { IUser } from '@domain/user/user.interface'
import { mapUserDtoToUser } from '@domain/user/user.mapper'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { AuthApi } from '@providers/auth/auth.interface'
import { CustomerApi } from '@providers/customer/customer.interface'
import { UserApi } from '@providers/user/user.interface'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { extractErrorMessage } from '@resetshop/angular-core/store/extract-error-message'
import { AuthStore } from '@store/auth/auth.store'
import { catchError, EMPTY, map, type Observable, pipe, switchMap, tap } from 'rxjs'
import type { ProfileMutationError, ProfileReadError } from './profile.types'
import { initialProfileState } from './profile.types'

export interface SaveProfileParams {
	firstName: string
	lastName: string
	/** Customer registration details; null for staff accounts, which only edit their name. */
	customer: CustomerDetails | null
}

function patchReadError(
	current: ProfileReadError,
	key: keyof ProfileReadError,
	value: string | null,
): ProfileReadError {
	return { ...current, [key]: value }
}

function patchMutationError(
	current: ProfileMutationError,
	key: keyof ProfileMutationError,
	value: string | null,
): ProfileMutationError {
	return { ...current, [key]: value }
}

/**
 * The user as the API sees it after saving `params`. The update responses do not always repeat the
 * roles, so an empty answer falls back to the roles the user already holds.
 */
function toUpdatedUserDto(current: IUser, params: SaveProfileParams, response: Partial<UserDto> | null): UserDto {
	return {
		id: current.id,
		userName: response?.userName ?? current.userName,
		firstName: params.firstName,
		lastName: params.lastName,
		avatar: response?.avatar ?? current.avatar,
		email: current.email,
		roles: response?.roles?.length ? response.roles : [...current.roles],
		hasFinishedRegistration: response?.hasFinishedRegistration ?? current.hasFinishedRegistration,
	}
}

/**
 * ProfileStore - Signal Store for the signed-in user's own profile.
 *
 * Staff accounts edit their name through the backend's own profile endpoint; customers additionally complete their
 * customer registration, saved together with the user in one request. After a successful save the
 * signed-in user is refreshed so the whole app shows the new details.
 */
export const ProfileStore = signalStore(
	{ providedIn: 'root' },
	withState(initialProfileState),
	withMethods((store) => {
		const customerApi = inject(CustomerApi)
		const userApi = inject(UserApi)
		const authStore = inject(AuthStore)
		const authApi = inject(AuthApi)
		const loggerService = inject(Logger)

		function saveUser(current: IUser, params: SaveProfileParams): Observable<UserDto> {
			if (!params.customer) {
				return authApi
					.updateProfile({ firstName: params.firstName, lastName: params.lastName })
					.pipe(map(() => toUpdatedUserDto(current, params, null)))
			}
			const customerDto: CustomerDto = mapCustomerToDto({ ...params.customer, id: store.customer()?.id })
			const userName = `${params.firstName}_${params.lastName}_`.toLowerCase() + current.id
			return userApi
				.updateCustomerUser(
					{ id: current.id, firstName: params.firstName, lastName: params.lastName, userName, email: current.email },
					customerDto,
				)
				.pipe(map((response) => toUpdatedUserDto(current, params, response)))
		}

		function applySavedProfile(updated: UserDto, params: SaveProfileParams): void {
			authStore.updateCurrentUser(mapUserDtoToUser(updated))
			patchState(store, {
				isSaving: false,
				customer: params.customer ? new Customer({ ...params.customer, id: store.customer()?.id }) : store.customer(),
			})
		}

		return {
			loadCustomer: rxMethod<string>(
				pipe(
					tap(() =>
						patchState(store, { isLoading: true, readError: patchReadError(store.readError(), 'customer', null) }),
					),
					switchMap((email) =>
						customerApi.getByEmail(email).pipe(
							tap({
								next: (dto) =>
									patchState(store, { customer: dto ? mapCustomerDtoToCustomer(dto) : null, isLoading: false }),
								error: (err) => {
									loggerService.error('ProfileStore', 'loadCustomer failed', err)
									patchState(store, {
										isLoading: false,
										readError: patchReadError(store.readError(), 'customer', 'Failed to load customer'),
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			saveProfile: rxMethod<SaveProfileParams>(
				pipe(
					tap(() =>
						patchState(store, {
							isSaving: true,
							mutationError: patchMutationError(store.mutationError(), 'save', null),
						}),
					),
					switchMap((params) => {
						const current = authStore.currentUser()
						if (!current) {
							patchState(store, { isSaving: false })
							return EMPTY
						}
						return saveUser(current, params).pipe(
							tap({
								next: (updated) => applySavedProfile(updated, params),
								error: (err) => {
									loggerService.error('ProfileStore', 'saveProfile failed', err)
									patchState(store, {
										isSaving: false,
										mutationError: patchMutationError(
											store.mutationError(),
											'save',
											extractErrorMessage(err, 'Failed to save profile'),
										),
									})
								},
							}),
							catchError(() => EMPTY),
						)
					}),
				),
			),

			clearErrors(): void {
				patchState(store, { readError: { customer: null }, mutationError: { save: null } })
			},
		}
	}),
)
