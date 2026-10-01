/**
 * Offset/limit query used by list endpoints that paginate server-side.
 */
export interface SearchPaginationParams {
	offset: number
	limit: number
	search?: string
}

/**
 * Envelope returned by the paginated Brillante endpoints (`/client/getAll/:offset/:limit`).
 */
export interface PaginatedRows<T> {
	count: number
	rows: T[]
}

/**
 * Normalised page shape consumed by the stores and data tables.
 */
export interface PaginatedResponse<T> {
	data: T[]
	total: number
	offset: number
	limit: number
}
