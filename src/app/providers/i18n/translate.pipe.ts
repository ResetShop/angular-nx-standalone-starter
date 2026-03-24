import { inject, Pipe, type PipeTransform } from '@angular/core'
import { Translation } from './translation'
import type { TranslationKey } from './translations.schema'

/**
 * Pure pipe that translates a key using the Translation service.
 * Translations are loaded synchronously by the app initializer before the first render,
 * so this pipe is safe to use as a pure pipe (output is stable for the session's language).
 *
 * @example
 * ```html
 * <h1>{{ 'USERS.PAGE.TITLE' | translate }}</h1>
 * <button>{{ 'COMMON.CANCEL' | translate }}</button>
 * ```
 */
@Pipe({ name: 'translate', pure: true, standalone: true })
export class TranslatePipe implements PipeTransform {
	private readonly translation = inject(Translation)

	public transform(key: TranslationKey): string {
		return this.translation.instant(key)
	}
}
