/**
 * Default pagination settings used across repositories.
 */
export const PAGINATION_DEFAULTS = {
	/** Default number of items per page */
	MIN_LIMIT: 1,
	LIMIT: 10,
	MAX_LIMIT: 500,
	/** Default starting offset */
	OFFSET: 0,
} as const;
