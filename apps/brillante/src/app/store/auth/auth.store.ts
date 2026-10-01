import { computed, inject } from '@angular/core'
import type { IUser } from '@domain/user/user.interface'
import { mapUserDtoToUser } from '@domain/user/user.mapper'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { AuthSession } from '@providers/auth/auth-session'
import { AuthApi } from '@providers/auth/auth.interface'
import { IdentityApi } from '@providers/identity/identity.interface'
import { Logger } from '@resetshop/angular-core/logger/logger.token'
import { catchError, EMPTY, exhaustMap, of, pipe, switchMap, tap } from 'rxjs'
import { initialAuthState } from './auth.types'

/**
 * AuthStore - Signal Store for the Brillante session.
 *
 * Identity is delegated to Auth0 (`IdentityApi`); once Auth0 reports a profile it is exchanged
 * for the Brillante user and API JWT (`AuthApi`), which `AuthSession` persists across reloads.
 */
export const AuthStore = signalStore(
	{ providedIn: 'root' },
	withState(initialAuthState),
	withComputed((store) => ({
		isAuthenticated: computed(() => !!store.currentUser()),
		userRoles: computed(() => store.currentUser()?.roles ?? []),
		userPermissions: computed(() => store.currentUser()?.permissions ?? []),
	})),
	withMethods((store) => {
		const authApi = inject(AuthApi)
		const identityApi = inject(IdentityApi)
		const authSession = inject(AuthSession)
		const loggerService = inject(Logger)

		return {
			/**
			 * Replaces the signed-in user, e.g. after the profile page saved new details.
			 */
			updateCurrentUser(user: IUser): void {
				patchState(store, { currentUser: user })
			},

			/**
			 * Restores the persisted API session, if any, without contacting the backend.
			 */
			restoreSession(): void {
				const session = authSession.read()
				if (session) {
					patchState(store, { currentUser: mapUserDtoToUser(session) })
				}
			},

			/**
			 * Resolves the Auth0 profile and exchanges it for the Brillante session. Leaves
			 * `currentUser` null when Auth0 has no active session.
			 */
			login: rxMethod<void>(
				pipe(
					tap(() => patchState(store, { isLoggingIn: true, loginError: null })),
					exhaustMap(() =>
						identityApi.getProfile().pipe(
							switchMap((profile) => (profile ? authApi.authenticate(profile) : of(null))),
							tap({
								next: (session) => {
									if (session) authSession.write(session)
									patchState(store, {
										currentUser: session ? mapUserDtoToUser(session) : null,
										isLoggingIn: false,
									})
								},
								error: (error: unknown) => {
									loggerService.error('AuthStore', 'login failed', error)
									patchState(store, { isLoggingIn: false, loginError: 'LOGIN_FAILED' })
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			/**
			 * Sends the browser to the Auth0 login page.
			 */
			redirectToLogin: rxMethod<void>(
				pipe(
					exhaustMap(() =>
						identityApi.loginWithRedirect().pipe(
							tap({ error: (error: unknown) => loggerService.error('AuthStore', 'redirectToLogin failed', error) }),
							catchError(() => EMPTY),
						),
					),
				),
			),

			/**
			 * Clears the local session and ends the Auth0 session.
			 */
			logout: rxMethod<void>(
				pipe(
					tap(() => {
						authSession.clear()
						patchState(store, { currentUser: null, isLoggingOut: true })
					}),
					exhaustMap(() =>
						identityApi.logout().pipe(
							tap({
								error: (error: unknown) => loggerService.error('AuthStore', 'logout failed', error),
								finalize: () => patchState(store, { isLoggingOut: false }),
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
			store.restoreSession()
		},
	}),
)
