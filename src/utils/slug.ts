/**
 * Converts a human-readable string into a snake_case code identifier.
 * Matches the role code Zod schema: `^[a-z][a-z0-9_]*$`
 *
 * Steps: trim → lowercase → strip special chars → spaces to underscores → strip leading non-alpha
 */
export function toSnakeCode(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s_]/g, '')
		.replace(/\s+/g, '_')
		.replace(/^[^a-z]+/, '')
}
