/**
 * Pure diagnostics for database connectivity failures.
 *
 * `HealthService.checkDatabase` catches a failed `SELECT 1` whose top-level message is the
 * opaque Drizzle wrapper `Failed query: SELECT 1`. The real cause — a pg SQLSTATE, a Node
 * socket errno, or a TLS error — lives on the `cause` chain. `describeDbError` unwinds that
 * chain into one diagnostic string (code + root message + `address:port` + an actionable
 * hint) so a startup failure is debuggable from the logs alone.
 *
 * Only the driver's own non-sensitive fields (`code`, `address`, `port`, `message`) are read —
 * the connection string and credentials are never touched, so they can never leak into a log.
 */

interface DbErrorInfo {
	code: string | null
	address: string | null
	port: number | null
	message: string
}

const MAX_CAUSE_DEPTH = 8

// SQLSTATE / Node-errno → actionable hint. Keyed by the driver's own `code` field.
const HINT_BY_CODE: Readonly<Record<string, string>> = {
	'28P01': 'authentication failed — verify the DB password; rotated credentials must be updated in the deploy host env',
	'28000': 'authentication failed — verify the DB password; rotated credentials must be updated in the deploy host env',
	'3D000': 'database does not exist — check the database name in the connection string',
	ECONNREFUSED:
		'connection refused — if the host is localhost, PG_CONNECTION_STRING is likely unset or misnamed in the deploy environment',
	ENOTFOUND: 'host not found / DNS failure — verify the DB host (for Supabase, use the IPv4 pooler host)',
	EAI_AGAIN: 'host not found / DNS failure — verify the DB host (for Supabase, use the IPv4 pooler host)',
	ETIMEDOUT:
		'connection timed out — host unreachable; for Supabase use the IPv4 pooler and confirm the project is not paused',
}

const TLS_HINT = 'TLS/SSL handshake failed — try appending ?sslmode=require to the connection string'

/** Folds one error node's non-sensitive fields into the accumulator, preferring the code-bearing node. */
function applyNode(node: Record<string, unknown>, info: DbErrorInfo): void {
	const message = typeof node['message'] === 'string' ? node['message'] : null
	if (message && info.message === 'Unknown error') info.message = message
	if (info.code || typeof node['code'] !== 'string') return

	info.code = node['code']
	if (message) info.message = message
	if (typeof node['address'] === 'string') info.address = node['address']
	if (typeof node['port'] === 'number') info.port = node['port']
}

/** Walks the `cause` chain (depth-capped, cycle-guarded) collecting the most specific diagnostics. */
function extractDbErrorInfo(error: unknown): DbErrorInfo {
	const info: DbErrorInfo = { code: null, address: null, port: null, message: 'Unknown error' }
	const seen = new Set<unknown>()
	let current = error

	for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
		if (!current || typeof current !== 'object' || seen.has(current)) break
		seen.add(current)
		const node = current as Record<string, unknown>
		applyNode(node, info)
		current = node['cause']
	}

	return info
}

function looksLikeTlsError(code: string | null, message: string): boolean {
	return (
		/self[- ]signed|certificate|\bcert\b|\bssl\b|\btls\b/i.test(message) || (code ?? '').toUpperCase().includes('CERT')
	)
}

function hintFor(code: string | null, message: string): string | null {
	if (code && HINT_BY_CODE[code]) return HINT_BY_CODE[code]
	if (looksLikeTlsError(code, message)) return TLS_HINT
	return null
}

/**
 * Renders a database error into a single diagnostic line:
 * `"<CODE> <root message> at <address>:<port> — <hint>"` (segments present only when known).
 * Total and pure — never throws, regardless of the input shape.
 */
export function describeDbError(error: unknown): string {
	const { code, address, port, message } = extractDbErrorInfo(error)
	const segments: string[] = []

	if (code) segments.push(code)
	segments.push(message)
	if (address) segments.push(`at ${address}${port === null ? '' : `:${port}`}`)

	const detail = segments.join(' ')
	const hint = hintFor(code, message)
	return hint ? `${detail} — ${hint}` : detail
}
