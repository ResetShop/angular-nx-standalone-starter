import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthStore } from '@store/auth/auth.store'
import { catchError, throwError } from 'rxjs'
import { environment } from '../environments/environment'

/**
 * A 401 from the Brillante API means the JWT is missing, expired or revoked: the local session
 * is dropped and the Auth0 session ended so the user signs in again. The error still propagates
 * so the caller can stop its own loading state.
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
	const authStore = inject(AuthStore)

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			if (error.status === 401 && req.url.startsWith(environment.apiUrl)) {
				authStore.logout()
			}
			return throwError(() => error)
		}),
	)
}
