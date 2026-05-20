import { type Provider, signal } from '@angular/core'
import { type Language, Translation } from '@resetshop/angular-core/i18n/translation'
import { MOCK_TRANSLATIONS } from '../apps/reference-app/src/app/providers/i18n/mock-translations'

/**
 * Fake `Translation` service for Storybook. Bypasses the real `TRANSLATION_LOADER`
 * plumbing entirely — `setLanguage`/`loadDefaultLanguage` are no-op promises that
 * resolve instantly, and `instant()` reads from the shared `MOCK_TRANSLATIONS` table.
 *
 * Replacing `Translation` wholesale with `useValue` is the pattern that survives
 * Storybook 10's docs-page renderer: providing only `TRANSLATION_LOADER` via
 * `provideTranslation()` is not consistently honoured for indirect token
 * dependencies of `@Injectable({ providedIn: 'root' })` services, and webpack
 * chunk duplication of the `Translation` class makes the env-level provider
 * miss in some story chunks. This factory is robust against both issues.
 */
function createStoryTranslation(): Translation {
	const currentLang = signal<Language>('en')
	return {
		currentLanguage: currentLang.asReadonly(),
		instant: (key: string) => MOCK_TRANSLATIONS[currentLang()][key] ?? key,
		setLanguage: async (lang: Language) => {
			currentLang.set(lang)
		},
		loadDefaultLanguage: async () => undefined,
		getCurrentLanguage: () => currentLang(),
	} as unknown as Translation
}

/** Global provider array — wire into `applicationConfig({ providers: [...storyTranslationProviders] })`. */
export const storyTranslationProviders: Provider[] = [{ provide: Translation, useValue: createStoryTranslation() }]
