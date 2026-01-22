import { z } from 'zod';

/**
 * Pagination query parameters schema.
 * Matches PAGINATION_DEFAULTS from api/constants/pagination.constants.ts
 */
export const paginationParamsSchema = z.object({
	offset: z.coerce.number().int().min(0).optional(),
	limit: z.coerce.number().int().min(1).max(500).optional(),
});

/**
 * Factory function to create a paginated response schema for any item type.
 *
 * @param itemSchema - Zod schema for the items in the data array
 * @returns Paginated response schema with data, total, offset, and limit
 *
 * @example
 * const paginatedRolesSchema = paginatedResponseSchema(roleDataSchema);
 */
export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
	return z.object({
		data: z.array(itemSchema),
		total: z.number(),
		offset: z.number(),
		limit: z.number(),
	});
}
