import { Injectable, signal } from '@angular/core'
import { environment } from '../../environments/environment'
import type { TranslationKey, TranslationSchema } from './translations.schema'

/**
 * Supported languages in the application.
 */
export type Language = 'en' | 'es'

const LANGUAGE_STORAGE_KEY = 'app_language'

function isLanguage(value: string | null): value is Language {
	return value === 'en' || value === 'es'
}

/**
 * Translation provider for i18n support.
 *
 * Translations are lazy-loaded via dynamic imports and cached in memory.
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
	/**
	 * Current active language signal.
	 * Initializes from localStorage (if available), then environment default, then 'en'.
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
	 * Loads a specific translation file asynchronously.
	 * Uses dynamic imports to lazy-load TypeScript translation modules.
	 *
	 * @param lang - Language to load
	 * @throws Error if the translation file fails to load or language is not supported
	 */
	private async loadTranslation(lang: Language): Promise<void> {
		// Only load if not already loaded
		if (this.translations[lang] !== null) {
			return
		}

		try {
			let module
			switch (lang) {
				case 'en':
					module = await import('./translations/en')
					break
				case 'es':
					module = await import('./translations/es')
					break
				default:
					throw new Error(`Unsupported language: ${lang}`)
			}
			this.translations[lang] = module.default
		} catch (error) {
			throw new Error(`Failed to load ${lang} translations`, { cause: error })
		}
	}

	/**
	 * Gets a translated string for the given key in the current language.
	 *
	 * If the translation is not found, returns the key itself as a fallback.
	 * This method is synchronous - ensure translations are loaded before calling.
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

		// Navigate through nested keys (e.g., 'AUTH.ERRORS.ACCOUNT_LOCKED')
		const keys = key.split('.')
		let value: unknown = currentTranslations

		for (const k of keys) {
			if (typeof value === 'object' && value !== null && k in value) {
				value = (value as Record<string, unknown>)[k]
			} else {
				// Key not found, return the key itself as fallback
				return key
			}
		}

		return typeof value === 'string' ? value : key
	}

	/**
	 * Sets the active language.
	 * Lazy-loads the translation file if not already cached, then switches.
	 * Persists the choice in localStorage for subsequent visits.
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
	 *
	 * @returns Current language code
	 */
	public getCurrentLanguage(): Language {
		return this.currentLang()
	}

	/**
	 * Resolves the initial language from localStorage → environment default → 'en'.
	 */
	private resolveInitialLanguage(): Language {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
			if (isLanguage(stored)) return stored
		}
		return (environment.defaultLanguage as Language) ?? 'en'
	}
}
