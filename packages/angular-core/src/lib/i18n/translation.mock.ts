import { Injectable, makeEnvironmentProviders } from '@angular/core'
import type { Language } from './translation'
import { DEFAULT_LANGUAGE, Translation, TRANSLATION_LOADER } from './translation'
import type { TranslationKey } from './translations.schema'

/**
 * Minimal translation mock for package-level tests.
 * Returns the key as-is — no actual translations loaded.
 */
@Injectable({ providedIn: 'root' })
export class TranslationMock extends Translation {
	public override instant(key: TranslationKey): string {
		return key
	}

	public override async loadDefaultLanguage(): Promise<void> {
		// No-op
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
	return makeEnvironmentProviders([
		{ provide: DEFAULT_LANGUAGE, useValue: 'en' as Language },
		{ provide: TRANSLATION_LOADER, useValue: async () => ({}) },
		{ provide: Translation, useClass: TranslationMock },
	])
}
