import { Injectable, type Provider } from '@angular/core'
import type { Language } from './translation'
import { Translation } from './translation'
import type { TranslationKey } from './translations.schema'

@Injectable({ providedIn: 'root' })
export class TranslationMock extends Translation {
	public override instant(key: TranslationKey): string {
		return key
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

export const provideTranslationMock = (): Provider[] => [{ provide: Translation, useClass: TranslationMock }]
