import { Injectable, makeEnvironmentProviders } from '@angular/core'
import { MOCK_TRANSLATIONS } from '@providers/i18n/translation.mock'
import type { Language } from '@resetshop/angular-core/i18n/translation'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import type { TranslationKey } from '@resetshop/angular-core/i18n/translations.schema'
import { fn, type MockFn } from '@resetshop/util/test-utils'

/**
 * Records the languages requested through `Translation.setLanguage` by the stub provided with
 * `provideSliceTranslationMock`.
 */
export const setLanguageMock: MockFn<[Language], Promise<void>> = fn<[Language], Promise<void>>()

/**
 * Flattens a nested translation object into the dot-notation keys `Translation.instant` resolves.
 */
export function flattenTranslations(node: object, prefix = ''): Record<string, string> {
	const flat: Record<string, string> = {}
	for (const [key, value] of Object.entries(node)) {
		const path = prefix ? `${prefix}.${key}` : key
		if (typeof value === 'string') {
			flat[path] = value
		} else {
			Object.assign(flat, flattenTranslations(value as object, path))
		}
	}
	return flat
}

/**
 * Builds a `Translation` stub that resolves the keys of the given feature slices (for example
 * `settingsEn`) and the common keys of `MOCK_TRANSLATIONS`, so page specs render the real English
 * copy. Unknown keys resolve to themselves, like the regular mock.
 */
export function provideSliceTranslationMock(...slices: object[]) {
	const translations: Record<string, string> = Object.assign(
		{},
		MOCK_TRANSLATIONS,
		...slices.map((slice) => flattenTranslations(slice)),
	)

	@Injectable()
	class SliceTranslationMock extends Translation {
		public override instant(key: TranslationKey, fallback?: string): string {
			return translations[key] ?? fallback ?? key
		}

		public override async loadDefaultLanguage(): Promise<void> {
			// No-op — the stub does not load translation files
		}

		public override setLanguage(lang: Language): Promise<void> {
			return setLanguageMock(lang) ?? Promise.resolve()
		}
	}

	return makeEnvironmentProviders([{ provide: Translation, useClass: SliceTranslationMock }])
}
