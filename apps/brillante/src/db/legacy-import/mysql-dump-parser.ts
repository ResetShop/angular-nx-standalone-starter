import { SafeImportError } from './safe-import-error'

/** A value of an `INSERT` tuple: the unquoted text of a literal or the content of a string, `null` for SQL NULL. */
export type SqlValue = string | null

export type DumpRow = Readonly<Record<string, SqlValue>>

/** The rows of every `INSERT INTO` statement of a dump, grouped by table name. */
export type DumpTables = ReadonlyMap<string, readonly DumpRow[]>

/**
 * Thrown when the dump does not have the expected shape. The message carries the offset and the expectation,
 * never the surrounding text: the dump holds personal data and errors end up in terminals and logs.
 */
export class MysqlDumpParseError extends SafeImportError {
	constructor(expectation: string, offset: number) {
		super(`Cannot parse the MySQL dump at offset ${offset}: expected ${expectation}`)
		this.name = 'MysqlDumpParseError'
	}
}

interface Cursor {
	readonly text: string
	offset: number
}

function isWhitespace(character: string): boolean {
	return character === ' ' || character === '\n' || character === '\r' || character === '\t'
}

function skipWhitespace(cursor: Cursor): void {
	while (cursor.offset < cursor.text.length && isWhitespace(cursor.text[cursor.offset])) {
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
	const escapes: Readonly<Record<string, string>> = { '0': '\0', b: '\b', n: '\n', r: '\r', t: '\t', Z: '\x1a' }
	const { text } = cursor
	let value = ''
	cursor.offset += 1
	while (cursor.offset < text.length) {
		const character = text[cursor.offset]
		if (character === '\\') {
			const escaped = text[cursor.offset + 1]
			if (escaped === undefined) break
			value += escapes[escaped] ?? escaped
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

/** Unquoted literals the legacy export uses: numbers and NULL. Binary and hex literals are not supported. */
function readLiteral(cursor: Cursor): SqlValue {
	const start = cursor.offset
	while (
		cursor.offset < cursor.text.length &&
		cursor.text[cursor.offset] !== ',' &&
		cursor.text[cursor.offset] !== ')'
	) {
		cursor.offset += 1
	}
	const literal = cursor.text.slice(start, cursor.offset).trim()
	if (literal.toUpperCase() === 'NULL') return null
	if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(literal)) return literal
	throw new MysqlDumpParseError('a number, NULL or a quoted string (binary and hex literals are not supported)', start)
}

function readValue(cursor: Cursor): SqlValue {
	skipWhitespace(cursor)
	return cursor.text[cursor.offset] === "'" ? readQuoted(cursor) : readLiteral(cursor)
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
	const header = /INSERT\s+INTO\s+`([A-Za-z0-9_]+)`\s*\(([^)]*)\)\s*VALUES/iy
	header.lastIndex = cursor.offset
	const match = header.exec(cursor.text)
	if (!match) {
		throw new MysqlDumpParseError('an INSERT INTO `table` (columns) VALUES statement', cursor.offset)
	}
	cursor.offset = header.lastIndex
	const columns = match[2].split(',').map((column) => column.trim().replaceAll('`', ''))
	return { table: match[1], rows: readTuples(cursor, columns) }
}

/**
 * Parses the `INSERT INTO` statements of a MySQL dump made only of such statements (the format of the legacy
 * Brillante export). A statement starts at the beginning of a line, so comments and blank lines between
 * statements are skipped and the keywords match in any case. When `tables` is given, the rows of the other
 * tables are parsed to find the end of their statement but not kept. A table without statements is absent
 * from the result.
 */
export function parseMysqlDump(sql: string, tables?: readonly string[]): DumpTables {
	const wanted = tables ? new Set(tables) : null
	const result = new Map<string, DumpRow[]>()
	const cursor: Cursor = { text: sql, offset: 0 }
	const statementStart = /^[ \t]*INSERT[ \t]+INTO/gim

	for (;;) {
		statementStart.lastIndex = cursor.offset
		const next = statementStart.exec(sql)
		if (!next) return result
		cursor.offset = next.index
		skipWhitespace(cursor)
		const { table, rows } = readInsertStatement(cursor)
		if (wanted && !wanted.has(table)) continue
		const kept = result.get(table) ?? []
		for (const row of rows) kept.push(row)
		result.set(table, kept)
	}
}
