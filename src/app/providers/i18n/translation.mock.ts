import { Injectable, makeEnvironmentProviders } from '@angular/core'
import type { Language } from './translation'
import { Translation } from './translation'
import type { TranslationKey } from './translations.schema'

/**
 * Common translation keys used across page specs for data tables, pagination, and validation.
 */
export const MOCK_TRANSLATIONS: Record<string, string> = {
	'DATA_TABLE.EMPTY': 'No data available',
	'DATA_TABLE.LOADING': 'Loading...',
	'PAGINATION.LABEL': 'Pagination',
	'PAGINATION.ROWS_PER_PAGE': 'Rows per page',
	'PAGINATION.GO_TO_PREVIOUS': 'Previous page',
	'PAGINATION.GO_TO_NEXT': 'Next page',
	'PAGINATION.GO_TO_PAGE': 'Go to page {page}',
	'VALIDATION.REQUIRED': 'This field is required',
	'VALIDATION.MAX_LENGTH': 'Maximum {max} characters',
	'VALIDATION.PATTERN': 'Invalid format',
}

/**
 * Lightweight translation stub for component specs.
 * Looks up the key in MOCK_TRANSLATIONS; returns the raw key for unrecognised keys.
 * If an assertion needs a translated value, add the key to MOCK_TRANSLATIONS above.
 */
export const mockTranslation = {
	instant: (key: string) => MOCK_TRANSLATIONS[key] ?? key,
}

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

export function provideTranslationMock() {
	return makeEnvironmentProviders([{ provide: Translation, useClass: TranslationMock }])
}
