import { HttpErrorResponse, type HttpHandlerFn, type HttpInterceptorFn, type HttpRequest } from '@angular/common/http'
import { inject } from '@angular/core'
import { LegacyTokenSession } from '@providers/auth/legacy-token-session'
import { catchError, switchMap, throwError } from 'rxjs'
import { environment } from '../environments/environment'

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
	return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
}

/**
 * Authenticates requests to the legacy API: asks the backend for a token for the signed-in user and sends it as a
 * Bearer token. When the legacy API still answers 401 (the token expired between issue and use), one fresh token
 * is requested and the request is retried once; a second 401 propagates to the caller.
 *
 * If the token cannot be issued (no session), that failure is the request's error; the session refresh interceptor
 * has already handled it as a 401 of the app's own backend.
 */
export const legacyTokenInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
	if (!req.url.startsWith(environment.apiUrl)) {
		return next(req)
	}

	const session = inject(LegacyTokenSession)

	return session.get().pipe(
		switchMap((token) =>
			next(withToken(req, token)).pipe(
				catchError((error: HttpErrorResponse) => {
					if (error.status !== 401) {
						return throwError(() => error)
					}
					return session.renew().pipe(switchMap((fresh) => next(withToken(req, fresh))))
				}),
			),
		),
	)
}
