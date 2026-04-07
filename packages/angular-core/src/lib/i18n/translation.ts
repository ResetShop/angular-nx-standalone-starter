import { inject, Injectable, InjectionToken, signal } from '@angular/core'
import type { TranslationKey, TranslationSchema } from './translations.schema'

/**
 * Supported languages in the application.
 */
export type Language = 'en' | 'es'

/**
 * Injection token for the default language.
 * Consumers provide this via `provideTranslation({ defaultLanguage: 'en' })`.
 * Defaults to 'en' if not provided.
 */
export const DEFAULT_LANGUAGE = new InjectionToken<Language>('DefaultLanguage', {
	providedIn: 'root',
	factory: () => 'en',
})

/**
 * Function type that loads a translation file for a given language.
 * Returns the translation schema object (the default export of the language file).
 */
export type TranslationLoaderFn = (lang: Language) => Promise<TranslationSchema>

/**
 * Injection token for the translation loader function.
 * Consumers provide this to define how translation files are loaded (e.g., dynamic imports).
 *
 * Default factory throws — consumers MUST provide a loader via `provideTranslation()`.
 */
export const TRANSLATION_LOADER = new InjectionToken<TranslationLoaderFn>('TranslationLoader', {
	providedIn: 'root',
	factory: () => {
		return async () => {
			throw new Error('No TRANSLATION_LOADER provided. Call provideTranslation() in your app config.')
		}
	},
})

const LANGUAGE_STORAGE_KEY = 'app_language'

function isLanguage(value: string | null): value is Language {
	return value === 'en' || value === 'es'
}

/**
 * Translation provider for i18n support.
 *
 * Translations are lazy-loaded via the injected `TRANSLATION_LOADER` and cached in memory.
 * Language preference is persisted in localStorage and restored on init.
 *
 * @example
 * ```typescript
 * // Get translated string
 * const message = translation.instant('AUTH.ERRORS.ACCOUNT_LOCKED');
 *
 * // Switch language at runtime (lazy-loads the translation file)
 * await translation.setLanguage('es');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class Translation {
	private readonly defaultLanguage = inject(DEFAULT_LANGUAGE)
	private readonly loader = inject(TRANSLATION_LOADER)

	/**
	 * Current active language signal.
	 * Initializes from localStorage (if available), then injected default, then 'en'.
	 */
	private readonly currentLang = signal<Language>(this.resolveInitialLanguage())

	/** Public readonly signal for the current language. */
	public readonly currentLanguage = this.currentLang.asReadonly()

	/**
	 * In-memory cache of loaded translations.
	 */
	private translations: Record<Language, TranslationSchema | null> = {
		en: null,
		es: null,
	}

	/**
	 * Loads the default language translations.
	 * Called by the app initializer to ensure translations are ready before app starts.
	 */
	public async loadDefaultLanguage(): Promise<void> {
		await this.loadTranslation(this.currentLang())
	}

	/**
	 * Loads a specific translation file asynchronously via the injected loader.
	 *
	 * @param lang - Language to load
	 * @throws Error if the translation file fails to load
	 */
	private async loadTranslation(lang: Language): Promise<void> {
		if (this.translations[lang] !== null) {
			return
		}

		try {
			this.translations[lang] = await this.loader(lang)
		} catch (error) {
			throw new Error(`Failed to load ${lang} translations`, { cause: error })
		}
	}

	/**
	 * Gets a translated string for the given key in the current language.
	 *
	 * @param key - Translation key in dot notation (e.g., 'AUTH.ERRORS.INVALID_CREDENTIALS')
	 * @returns Translated string or the key if not found
	 * @throws Error if translations for the current language are not loaded
	 */
	public instant(key: TranslationKey): string {
		const currentTranslations = this.translations[this.currentLang()]

		if (currentTranslations === null) {
			throw new Error(`Translations for language '${this.currentLang()}' are not loaded`)
		}

		const keys = key.split('.')
		let value: unknown = currentTranslations

		for (const k of keys) {
			if (typeof value === 'object' && value !== null && k in value) {
				value = (value as Record<string, unknown>)[k]
			} else {
				return key
			}
		}

		return typeof value === 'string' ? value : key
	}

	/**
	 * Sets the active language.
	 * Lazy-loads the translation file if not already cached, then switches.
	 *
	 * @param lang - Language code to set as active
	 */
	public async setLanguage(lang: Language): Promise<void> {
		await this.loadTranslation(lang)
		this.currentLang.set(lang)

		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
		}
	}

	/**
	 * Gets the current active language.
	 */
	public getCurrentLanguage(): Language {
		return this.currentLang()
	}

	/**
	 * Resolves the initial language from localStorage → injected default → 'en'.
	 */
	private resolveInitialLanguage(): Language {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
			if (isLanguage(stored)) return stored
		}
		return this.defaultLanguage
	}
}
