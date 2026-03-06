/**
 * Schema defining the structure of all translation files.
 * All language files (en.ts, es.ts, etc.) must satisfy this interface.
 */
export interface TranslationSchema {
	AUTH: {
		ERRORS: {
			INVALID_CREDENTIALS: string;
			ACCOUNT_LOCKED: string;
			ACCOUNT_DISABLED: string;
			ACCOUNT_DELETED: string;
			TOKEN_EXPIRED: string;
			TOKEN_INVALID: string;
			GENERIC: string;
		};
	};
	DATA_TABLE: {
		EMPTY: string;
		LOADING: string;
	};
	PAGINATION: {
		LABEL: string;
		ROWS_PER_PAGE: string;
		GO_TO_PREVIOUS: string;
		GO_TO_NEXT: string;
		GO_TO_PAGE: string;
	};
	VALIDATION: {
		REQUIRED: string;
		EMAIL: string;
		MIN_LENGTH: string;
		MAX_LENGTH: string;
		MIN: string;
		MAX: string;
		PATTERN: string;
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
 * // Result = 'AUTH.ERRORS.INVALID_CREDENTIALS' | 'AUTH.ERRORS.ACCOUNT_LOCKED' | ...
 */
export type TranslationKey = PathsToStringProps<TranslationSchema>;
