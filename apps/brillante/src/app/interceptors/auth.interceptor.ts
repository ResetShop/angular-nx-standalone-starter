import { HttpInterceptorFn } from '@angular/common/http'
import { environment } from '../environments/environment'

/**
 * Sends the session cookie with every request to this app's own backend (`/api/...`, same origin). The access token is an
 * HttpOnly cookie, so nothing is attached by hand. Requests to the legacy API are left alone: it authenticates
 * with a bearer token (see `legacyTokenInterceptor`) and must not receive the cookie.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
	if (req.url.startsWith(environment.apiUrl)) {
		return next(req)
	}

	const url = new URL(req.url, location.origin)
	if (url.origin === location.origin && url.pathname.startsWith('/api/')) {
		return next(req.clone({ withCredentials: true }))
	}

	return next(req)
}
