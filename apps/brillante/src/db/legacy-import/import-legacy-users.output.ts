import { SafeImportError } from './safe-import-error'

interface DatabaseErrorFields {
	readonly code?: unknown
	readonly constraint?: unknown
	readonly table?: unknown
	readonly column?: unknown
}

/**
 * The database the import is about to touch, without credentials, so the operator can see where it points.
 * An unparsable connection string is described as such rather than echoed.
 */
export function describeConnectionTarget(connectionString: string): string {
	try {
		const url = new URL(connectionString)
		return `${url.hostname}${url.port ? `:${url.port}` : ''}${url.pathname}`
	} catch {
		return '(the connection string could not be parsed)'
	}
}

function findDatabaseFields(error: unknown): DatabaseErrorFields | null {
	for (let current: unknown = error, depth = 0; current && depth < 5; depth += 1) {
		const fields = current as DatabaseErrorFields
		if (typeof fields.code === 'string') return fields
		current = (current as { cause?: unknown }).cause
	}
	return null
}

function describeDatabaseError(fields: DatabaseErrorFields): string {
	const parts = [`code ${String(fields.code)}`]
	for (const key of ['table', 'column', 'constraint'] as const) {
		if (typeof fields[key] === 'string') parts.push(`${key} ${String(fields[key])}`)
	}
	return `Database error (${parts.join(', ')}). The message is withheld because it can contain personal data.`
}

/**
 * Text to print when the import fails. Messages written by the importer (`SafeImportError`) are shown as they are.
 * A database error is reduced to its code and the table, column and constraint it names: the driver's message
 * and the PostgreSQL detail hold the failed statement with every parameter and the offending value. Anything else
 * is reported by its type only.
 */
export function formatImportFailure(error: unknown): string {
	if (error instanceof SafeImportError) return error.message
	const database = findDatabaseFields(error)
	if (database) return describeDatabaseError(database)
	const type = error instanceof Error ? error.name : typeof error
	return `Unexpected ${type}. The message is withheld because it can contain personal data.`
}
