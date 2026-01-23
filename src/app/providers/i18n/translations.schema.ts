/**
 * Schema defining the structure of all translation files.
 * All language files (en.ts, es.ts, etc.) must satisfy this interface.
 */
export interface TranslationSchema {
	AUTH: {
		ERRORS: {
			ACCOUNT_LOCKED: string;
			INVALID_CREDENTIALS: string;
			GENERIC: string;
		};
	};
}

/**
 * Recursively extracts all dot-notation paths from a nested object type.
 * Converts { AUTH: { ERRORS: { ACCOUNT_LOCKED: string } } }
 * Into: 'AUTH.ERRORS.ACCOUNT_LOCKED'
 */
type PathsToStringProps<T, Prefix extends string = ''> = T extends string
	? Prefix
	: {
			[K in keyof T]: K extends string
				? PathsToStringProps<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K}`>
				: never;
		}[keyof T];

/**
 * Type-safe translation keys derived from TranslationSchema.
 * Enforces that only valid keys can be passed to the instant() method.
 *
 * @example
 * type Result = TranslationKey;
 * // Result = 'AUTH.ERRORS.ACCOUNT_LOCKED' | 'AUTH.ERRORS.INVALID_CREDENTIALS' | 'AUTH.ERRORS.GENERIC'
 */
export type TranslationKey = PathsToStringProps<TranslationSchema>;
