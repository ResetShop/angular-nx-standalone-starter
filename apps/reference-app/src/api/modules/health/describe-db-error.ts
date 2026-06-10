/**
 * Diagnostic, log-safe description of a database error.
 *
 * Drizzle wraps driver failures in a generic `Failed query: ...` error, so the real
 * reason is hidden in the `cause` chain. This helper unwinds that chain and surfaces
 * the underlying PostgreSQL SQLSTATE / Node socket codes (plus an actionable hint for
 * the common ones), so a failing startup health check logs *why* it failed — without
 * ever exposing the connection string or credentials.
 */

// Non-sensitive fields carried by pg server errors and Node socket errors. The
// connection string and password are never among these, so they are safe to log.
const DIAGNOSTIC_FIELDS = ['code', 'errno', 'syscall', 'address', 'port', 'severity', 'routine'] as const

// Actionable hints keyed by PostgreSQL SQLSTATE or Node socket error code.
const CODE_HINTS: Readonly<Record<string, string>> = {
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

const MAX_DEPTH = 5

function readField(source: object, field: string): string | undefined {
	const value = (source as Record<string, unknown>)[field]
	return value === undefined || value === null ? undefined : String(value)
}

function describeLevel(error: unknown): string {
	if (!(error instanceof Error)) return typeof error === 'string' ? error : 'Unknown error'
	const fields = DIAGNOSTIC_FIELDS.map((field): [string, string | undefined] => [
		field,
		readField(error, field),
	]).filter((entry): entry is [string, string] => entry[1] !== undefined)
	const suffix = fields.length > 0 ? ` (${fields.map(([field, value]) => `${field}=${value}`).join(', ')})` : ''
	return `${error.message}${suffix}`
}

function findHint(combinedMessage: string, codes: readonly string[]): string | undefined {
	const matchedCode = codes.find((code) => code in CODE_HINTS)
	if (matchedCode !== undefined) return CODE_HINTS[matchedCode]
	if (/\bssl\b/i.test(combinedMessage)) {
		return 'looks SSL-related — Supabase requires SSL; append `?sslmode=require` to PG_CONNECTION_STRING'
	}
	return undefined
}

export function describeDbError(error: unknown): string {
	const levels: string[] = []
	const codes: string[] = []
	const seen = new Set<unknown>()
	let current: unknown = error

	while (current !== undefined && current !== null && !seen.has(current) && levels.length < MAX_DEPTH) {
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
