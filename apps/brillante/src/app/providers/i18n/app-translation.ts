import { inject, Injectable } from '@angular/core'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import type { TranslationKey } from '@resetshop/angular-core/i18n/translations.schema'
import type { AppTranslationKey } from './app-translations'

/**
 * Type-safe facade over `Translation.instant()` for the keys this application adds on top of the
 * starter's `TranslationSchema`. `Translation.instant()` only accepts the starter's own keys, so
 * the single widening cast lives here instead of at every call site. Templates keep using
 * `TranslatePipe`, which accepts any string.
 */
@Injectable({ providedIn: 'root' })
export class AppTranslation {
	private readonly translation = inject(Translation)

	public instant(key: AppTranslationKey, fallback?: string): string {
		return this.translation.instant(key as TranslationKey, fallback)
	}
}
