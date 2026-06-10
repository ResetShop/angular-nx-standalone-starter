/**
 * Diagnostic, log-safe description of a database error.
 *
 * Drizzle wraps driver failures in a generic `Failed query: ...` error, so the real
 * reason is hidden in the `cause` chain. This helper unwinds that chain and surfaces
 * the underlying PostgreSQL SQLSTATE / Node socket codes (plus an actionable hint for
 * the common ones), so the operator can see *why* a database probe failed in the logs.
 *
 * Output is intended for the application log only — never for an unauthenticated HTTP
 * response. It contains no credentials: only an allow-list of the driver's own error
 * fields is read, and the connection string is never stringified (see `describeLevel`).
 */

function readField(source: object, field: string): string | undefined {
	const value = (source as Record<string, unknown>)[field]
	return value === undefined || value === null ? undefined : String(value)
}

function describeLevel(error: unknown): string {
	if (!(error instanceof Error)) return typeof error === 'string' ? error : 'Unknown error'
	// Allow-list of non-sensitive fields carried by pg server errors and Node socket errors.
	// The connection string and password are never among these. The error *message* is also
	// safe: node-postgres / Drizzle messages are human-readable SQLSTATE narratives or socket
	// descriptions (e.g. `connect ECONNREFUSED host:port`), not a DSN echo. The full error
	// object is deliberately never stringified, which is what could carry the client config.
	const diagnosticFields = ['code', 'errno', 'syscall', 'address', 'port', 'severity', 'routine']
	const fields = diagnosticFields
		.map((field): [string, string | undefined] => [field, readField(error, field)])
		.filter((entry): entry is [string, string] => entry[1] !== undefined)
	const suffix = fields.length > 0 ? ` (${fields.map(([field, value]) => `${field}=${value}`).join(', ')})` : ''
	return `${error.message}${suffix}`
}

function findHint(combinedMessage: string, codes: readonly string[]): string | undefined {
	// Actionable hints keyed by PostgreSQL SQLSTATE or Node socket error code.
	const codeHints: Readonly<Record<string, string>> = {
		'28P01':
			'password authentication failed — the password in PG_CONNECTION_STRING is wrong; rotated credentials must also be updated in the deploy host env (e.g. Railway)',
		'28000': 'invalid authorization — check the user/role in PG_CONNECTION_STRING',
		'3D000': 'that database does not exist — check the database name in PG_CONNECTION_STRING',
		ECONNREFUSED:
			'nothing is listening at that host:port — a localhost target usually means PG_CONNECTION_STRING is unset or misnamed in the deploy host env',
		ENOTFOUND: 'the database host could not be resolved — check the host in PG_CONNECTION_STRING',
		ETIMEDOUT:
			'the connection timed out — check network/firewall and that the database is not paused; for Supabase use the IPv4 pooler host, not the direct IPv6 host',
		EAI_AGAIN: 'temporary DNS failure resolving the database host',
	}
	const matchedCode = codes.find((code) => code in codeHints)
	if (matchedCode !== undefined) return codeHints[matchedCode]
	if (/\bssl\b/i.test(combinedMessage)) {
		return 'looks SSL-related — Supabase requires SSL; append `?sslmode=require` to PG_CONNECTION_STRING'
	}
	return undefined
}

export function describeDbError(error: unknown): string {
	const maxDepth = 5
	const levels: string[] = []
	const codes: string[] = []
	const seen = new Set<unknown>()
	let current: unknown = error

	while (current !== undefined && current !== null && !seen.has(current) && levels.length < maxDepth) {
		seen.add(current)
		levels.push(describeLevel(current))
		if (!(current instanceof Error)) break
		const code = readField(current, 'code')
		if (code !== undefined) codes.push(code)
		current = (current as { cause?: unknown }).cause
	}

	if (levels.length === 0) return 'Unknown error'
	const base = levels.join(' | cause: ')
	const hint = findHint(base, codes)
	return hint !== undefined ? `${base} — ${hint}` : base
}
