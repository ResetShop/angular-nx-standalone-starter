import { Injectable, signal } from '@angular/core';
import type { TranslationKey, TranslationSchema } from './translations.schema';

/**
 * Supported languages in the application.
 */
export type Language = 'en' | 'es';

/**
 * Simple translation provider for i18n support.
 *
 * This provider offers basic translation capabilities using JSON files.
 * Translations are loaded asynchronously and cached in memory.
 *
 * Usage:
 * ```typescript
 * constructor(private i18n: Translation) {}
 *
 * getMessage() {
 *   return this.i18n.instant('AUTH.ERRORS.INVALID_CREDENTIALS');
 * }
 * ```
 *
 * @example
 * // Set language
 * translation.setLanguage('es');
 *
 * @example
 * // Get translated string
 * const message = translation.instant('AUTH.ERRORS.ACCOUNT_LOCKED');
 */
@Injectable({ providedIn: 'root' })
export class Translation {
	/**
	 * Current active language.
	 * Defaults to Spanish ('es').
	 */
	private readonly currentLang = signal<Language>('es');

	/**
	 * In-memory cache of loaded translations.
	 */
	private translations: Record<Language, TranslationSchema | null> = {
		en: null,
		es: null,
	};

	/**
	 * Loads the default language translations.
	 * Called by the app initializer to ensure translations are ready before app starts.
	 */
	async loadDefaultLanguage(): Promise<void> {
		await this.loadTranslation(this.currentLang());
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
			return;
		}

		try {
			let module;
			switch (lang) {
				case 'en':
					module = await import('./translations/en');
					break;
				case 'es':
					module = await import('./translations/es');
					break;
				default:
					throw new Error(`Unsupported language: ${lang}`);
			}
			this.translations[lang] = module.default;
		} catch (error) {
			throw new Error(`Failed to load ${lang} translations`, { cause: error });
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
	 *
	 * @example
	 * ```typescript
	 * const message = translation.instant('AUTH.ERRORS.ACCOUNT_LOCKED');
	 * // Returns: "Tu cuenta ha sido bloqueada..." (if language is 'es')
	 * // TypeScript will error if you use an invalid key:
	 * // translation.instant('INVALID.KEY'); // ❌ Type error
	 * ```
	 */
	instant(key: TranslationKey): string {
		const currentTranslations = this.translations[this.currentLang()];

		if (currentTranslations === null) {
			throw new Error(`Translations for language '${this.currentLang()}' are not loaded`);
		}

		// Navigate through nested keys (e.g., 'AUTH.ERRORS.ACCOUNT_LOCKED')
		const keys = key.split('.');
		let value: unknown = currentTranslations;

		for (const k of keys) {
			if (typeof value === 'object' && value !== null && k in value) {
				value = (value as Record<string, unknown>)[k];
			} else {
				// Key not found, return the key itself as fallback
				return key;
			}
		}

		return typeof value === 'string' ? value : key;
	}

	/**
	 * Sets the active language.
	 * Automatically loads the translation file if not already loaded.
	 *
	 * @param lang - Language code to set as active
	 *
	 * @example
	 * ```typescript
	 * await translation.setLanguage('en');
	 * ```
	 */
	async setLanguage(lang: Language): Promise<void> {
		await this.loadTranslation(lang);
		this.currentLang.set(lang);
	}

	/**
	 * Gets the current active language.
	 *
	 * @returns Current language code
	 */
	getCurrentLanguage(): Language {
		return this.currentLang();
	}
}
