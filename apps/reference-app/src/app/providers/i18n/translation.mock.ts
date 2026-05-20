import { Injectable, makeEnvironmentProviders } from '@angular/core'
import type { Language } from '@resetshop/angular-core/i18n/translation'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import type { TranslationKey } from '@resetshop/angular-core/i18n/translations.schema'
import { MOCK_TRANSLATIONS } from './mock-translations'

/**
 * Lightweight translation stub for component specs.
 * Looks up the key in `MOCK_TRANSLATIONS.en`; returns the raw key for unrecognised keys.
 * If an assertion needs a translated value, add the key to `mock-translations.ts`.
 */
export const mockTranslation = {
	instant: (key: string) => MOCK_TRANSLATIONS.en[key] ?? key,
}

@Injectable({ providedIn: 'root' })
export class TranslationMock extends Translation {
	public override instant(key: TranslationKey): string {
		return MOCK_TRANSLATIONS.en[key] ?? key
	}

	public override async loadDefaultLanguage(): Promise<void> {
		// No-op — mock does not load translation files
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- interface contract requires the parameter
	public override async setLanguage(_lang: Language): Promise<void> {
		// No-op
	}

	public override getCurrentLanguage(): Language {
		return 'en'
	}
}

export function provideTranslationMock() {
	return makeEnvironmentProviders([{ provide: Translation, useClass: TranslationMock }])
}
