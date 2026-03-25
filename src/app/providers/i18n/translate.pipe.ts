import { inject, Pipe, type PipeTransform } from '@angular/core'
import { Translation } from './translation'
import type { TranslationKey } from './translations.schema'

/**
 * Impure pipe that translates a key using the Translation service.
 * Marked impure so it re-evaluates when the active language changes at runtime.
 * The `instant()` call is a hashmap lookup — the per-cycle cost is negligible.
 *
 * @example
 * ```html
 * <h1>{{ 'USERS.PAGE.TITLE' | translate }}</h1>
 * <button>{{ 'COMMON.CANCEL' | translate }}</button>
 * ```
 */
@Pipe({ name: 'translate', pure: false, standalone: true })
export class TranslatePipe implements PipeTransform {
	private readonly translation = inject(Translation)

	public transform(key: string): string {
		return this.translation.instant(key as TranslationKey)
	}
}
