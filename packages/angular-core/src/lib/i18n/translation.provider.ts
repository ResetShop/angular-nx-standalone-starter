import { makeEnvironmentProviders } from '@angular/core'
import {
	DEFAULT_LANGUAGE,
	type Language,
	Translation,
	TRANSLATION_LOADER,
	type TranslationLoaderFn,
} from './translation'

export interface TranslationProviderConfig {
	defaultLanguage?: Language
	loader: TranslationLoaderFn
}

export function provideTranslation(config: TranslationProviderConfig) {
	return makeEnvironmentProviders([
		Translation,
		{ provide: DEFAULT_LANGUAGE, useValue: config.defaultLanguage ?? 'en' },
		{ provide: TRANSLATION_LOADER, useValue: config.loader },
	])
}
