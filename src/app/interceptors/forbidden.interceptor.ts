import { isPlatformBrowser } from '@angular/common'
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http'
import { inject, PLATFORM_ID } from '@angular/core'
import { Translation } from '@providers/i18n/translation'
import { UIStore } from '@store/ui/ui.store'
import { NotificationType } from '@store/ui/ui.types'
import { catchError, throwError } from 'rxjs'

/**
 * Intercepts HTTP 403 responses and shows a toast notification.
 *
 * - Shows a translated "permission denied" toast via UIStore
 * - Does NOT redirect — the user stays on the current page
 * - Does NOT suppress the error — stores can still handle it
 * - Logs the 403 for debugging
 *
 * Disabled during SSR because toast notifications require the browser DOM.
 */
export const forbiddenInterceptor: HttpInterceptorFn = (req, next) => {
	const platformId = inject(PLATFORM_ID)

	if (!isPlatformBrowser(platformId)) {
		return next(req)
	}

	const uiStore = inject(UIStore)
	const translation = inject(Translation)

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			if (error.status === 403) {
				console.error('[ForbiddenInterceptor] 403 Forbidden:', req.method, req.url)
				uiStore.showNotification({
					type: NotificationType.ERROR,
					message: translation.instant('HTTP.ERRORS.FORBIDDEN'),
				})
			}
			return throwError(() => error)
		}),
	)
}
