import type { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthSession } from '@providers/auth/auth-session'
import { environment } from '../environments/environment'

/**
 * Attaches the API-issued JWT as a Bearer token to requests sent to the Brillante API.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
	const token = inject(AuthSession).token

	if (token && req.url.startsWith(environment.apiUrl)) {
		return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
	}

	return next(req)
}
