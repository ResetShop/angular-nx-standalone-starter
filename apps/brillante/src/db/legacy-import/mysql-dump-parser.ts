/** A value of an `INSERT` tuple: the unquoted text of a literal or the content of a string, `null` for SQL NULL. */
export type SqlValue = string | null

export type DumpRow = Readonly<Record<string, SqlValue>>

/** The rows of every `INSERT INTO` statement of a dump, grouped by table name. */
export type DumpTables = ReadonlyMap<string, readonly DumpRow[]>

/**
 * Thrown when the dump does not have the expected shape. The message carries the offset and the expectation,
 * never the surrounding text: the dump holds personal data and errors end up in terminals and logs.
 */
export class MysqlDumpParseError extends Error {
	constructor(expectation: string, offset: number) {
		super(`Cannot parse the MySQL dump at offset ${offset}: expected ${expectation}`)
		this.name = 'MysqlDumpParseError'
	}
}

interface Cursor {
	readonly text: string
	offset: number
}

const STRING_ESCAPES: Readonly<Record<string, string>> = Object.freeze({
	'0': '\0',
	b: '\b',
	n: '\n',
	r: '\r',
	t: '\t',
	Z: '\x1a',
})

const INSERT_HEADER = /INSERT INTO `([A-Za-z0-9_]+)` \(([^)]*)\) VALUES/y

function skipWhitespace(cursor: Cursor): void {
	while (cursor.offset < cursor.text.length && /\s/.test(cursor.text[cursor.offset])) {
		cursor.offset += 1
	}
}

function expectCharacter(cursor: Cursor, expected: string): void {
	skipWhitespace(cursor)
	if (cursor.text[cursor.offset] !== expected) {
		throw new MysqlDumpParseError(`"${expected}"`, cursor.offset)
	}
	cursor.offset += 1
}

/** Reads a single-quoted string: backslash escapes and doubled quotes are both MySQL string syntax. */
function readQuoted(cursor: Cursor): string {
	const { text } = cursor
	let value = ''
	cursor.offset += 1
	while (cursor.offset < text.length) {
		const character = text[cursor.offset]
		if (character === '\\') {
			const escaped = text[cursor.offset + 1]
			value += STRING_ESCAPES[escaped] ?? escaped
			cursor.offset += 2
		} else if (character === "'") {
			if (text[cursor.offset + 1] === "'") {
				value += "'"
				cursor.offset += 2
			} else {
				cursor.offset += 1
				return value
			}
		} else {
			value += character
			cursor.offset += 1
		}
	}
	throw new MysqlDumpParseError('the closing quote of a string', cursor.offset)
}

function readValue(cursor: Cursor): SqlValue {
	skipWhitespace(cursor)
	if (cursor.text[cursor.offset] === "'") {
		return readQuoted(cursor)
	}
	const start = cursor.offset
	while (cursor.offset < cursor.text.length && !/[,)]/.test(cursor.text[cursor.offset])) {
		cursor.offset += 1
	}
	const literal = cursor.text.slice(start, cursor.offset).trim()
	if (literal === '') {
		throw new MysqlDumpParseError('a value', start)
	}
	return literal.toUpperCase() === 'NULL' ? null : literal
}

function readTuple(cursor: Cursor, columns: readonly string[]): DumpRow {
	expectCharacter(cursor, '(')
	const row: Record<string, SqlValue> = {}
	for (const [index, column] of columns.entries()) {
		if (index > 0) expectCharacter(cursor, ',')
		row[column] = readValue(cursor)
	}
	expectCharacter(cursor, ')')
	return row
}

/** Reads the comma-separated tuples that follow `VALUES` up to the terminating semicolon. */
function readTuples(cursor: Cursor, columns: readonly string[]): DumpRow[] {
	const rows: DumpRow[] = []
	for (;;) {
		rows.push(readTuple(cursor, columns))
		skipWhitespace(cursor)
		const separator = cursor.text[cursor.offset]
		cursor.offset += 1
		if (separator === ';') return rows
		if (separator !== ',') throw new MysqlDumpParseError('"," or ";" after a tuple', cursor.offset - 1)
	}
}

function readInsertStatement(cursor: Cursor): { table: string; rows: DumpRow[] } {
	INSERT_HEADER.lastIndex = cursor.offset
	const header = INSERT_HEADER.exec(cursor.text)
	if (!header) {
		throw new MysqlDumpParseError('an INSERT INTO `table` (columns) VALUES statement', cursor.offset)
	}
	cursor.offset = INSERT_HEADER.lastIndex
	const columns = header[2].split(',').map((column) => column.trim().replaceAll('`', ''))
	return { table: header[1], rows: readTuples(cursor, columns) }
}

/**
 * Parses the `INSERT INTO` statements of a MySQL dump made only of such statements (the format of the legacy
 * Brillante export). Text between statements (comments, blank lines) is skipped. When `tables` is given, the
 * rows of the other tables are parsed to find the end of their statement but not kept.
 */
export function parseMysqlDump(sql: string, tables?: readonly string[]): DumpTables {
	const wanted = tables ? new Set(tables) : null
	const result = new Map<string, DumpRow[]>()
	const cursor: Cursor = { text: sql, offset: 0 }

	for (;;) {
		const next = sql.indexOf('INSERT INTO', cursor.offset)
		if (next === -1) return result
		cursor.offset = next
		const { table, rows } = readInsertStatement(cursor)
		if (wanted && !wanted.has(table)) continue
		const kept = result.get(table) ?? []
		for (const row of rows) kept.push(row)
		result.set(table, kept)
	}
}
