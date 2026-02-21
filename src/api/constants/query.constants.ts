/**
 * Default query parameter settings used across controllers and repositories.
 */
export const QUERY_DEFAULTS = Object.freeze({
	/** Pagination */
	MIN_LIMIT: 1,
	LIMIT: 10,
	MAX_LIMIT: 500,
	OFFSET: 0,
	/** Array limits */
	MAX_ROLE_IDS_PER_REQUEST: 100,
	/** Search */
	SEARCH_MIN_LENGTH: 1,
	SEARCH_MAX_LENGTH: 100,
} as const);
