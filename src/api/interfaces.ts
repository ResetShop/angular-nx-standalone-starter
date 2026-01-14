// ============================================================================
// Shared API Interfaces
// ============================================================================

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
	offset?: number;
	limit?: number;
}

/**
 * Paginated response wrapper for list endpoints
 */
export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	offset: number;
	limit: number;
}
