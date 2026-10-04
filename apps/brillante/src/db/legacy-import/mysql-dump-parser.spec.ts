import { MysqlDumpParseError, parseMysqlDump } from './mysql-dump-parser'

function messageOf(action: () => unknown): string {
	try {
		action()
	} catch (error) {
		return (error as Error).message
	}
	return ''
}

describe('parseMysqlDump', () => {
	it('reads the rows of a multi-row INSERT keyed by column name', () => {
		const dump = "INSERT INTO `pet` (`id`, `name`) VALUES\n\t(1, 'Rex'),\n\t(2, 'Mia');\n"

		const rows = parseMysqlDump(dump).get('pet')

		expect(rows).toEqual([
			{ id: '1', name: 'Rex' },
			{ id: '2', name: 'Mia' },
		])
	})

	it('reads NULL as null and keeps numbers as their text', () => {
		const dump = 'INSERT INTO `pet` (`id`, `owner`, `weight`) VALUES (1, NULL, 3.5);\n'

		expect(parseMysqlDump(dump).get('pet')).toEqual([{ id: '1', owner: null, weight: '3.5' }])
	})

	it('treats a quoted NULL as the text and an unquoted NULL as the SQL value', () => {
		const dump = "INSERT INTO `pet` (`id`, `name`) VALUES (1, 'NULL'), (2, NULL);\n"

		expect(parseMysqlDump(dump).get('pet')).toEqual([
			{ id: '1', name: 'NULL' },
			{ id: '2', name: null },
		])
	})

	it('decodes backslash escapes and doubled quotes inside strings', () => {
		const dump = "INSERT INTO `pet` (`id`, `note`) VALUES (1, 'it\\'s'), (2, 'it''s'), (3, 'a\\\\b'), (4, 'x\\ny');\n"

		const notes = parseMysqlDump(dump)
			.get('pet')
			?.map((row) => row['note'])

		expect(notes).toEqual(["it's", "it's", 'a\\b', 'x\ny'])
	})

	it('does not end a statement at a semicolon, comma or parenthesis inside a string', () => {
		const dump = "INSERT INTO `pet` (`id`, `note`) VALUES (1, 'a;b, (c)'), (2, 'next');\n"

		expect(parseMysqlDump(dump).get('pet')).toEqual([
			{ id: '1', note: 'a;b, (c)' },
			{ id: '2', note: 'next' },
		])
	})

	it('does not mistake the text INSERT INTO inside a string for a statement', () => {
		const dump = "INSERT INTO `pet` (`id`, `note`) VALUES (1, 'INSERT INTO `x` (`a`) VALUES (9);');\n"

		const tables = parseMysqlDump(dump)

		expect([...tables.keys()]).toEqual(['pet'])
		expect(tables.get('pet')).toHaveLength(1)
	})

	it('skips comments and blank lines between statements and merges repeated statements of a table', () => {
		const dump =
			'-- header\n\nINSERT INTO `pet` (`id`) VALUES (1);\n\n-- more\nINSERT INTO `pet` (`id`) VALUES (2);\nINSERT INTO `toy` (`id`) VALUES (7);\n'

		const tables = parseMysqlDump(dump)

		expect(tables.get('pet')).toEqual([{ id: '1' }, { id: '2' }])
		expect(tables.get('toy')).toEqual([{ id: '7' }])
	})

	it('keeps only the requested tables when a list is given', () => {
		const dump = 'INSERT INTO `pet` (`id`) VALUES (1);\nINSERT INTO `toy` (`id`) VALUES (7);\n'

		expect([...parseMysqlDump(dump, ['toy']).keys()]).toEqual(['toy'])
	})

	it('finds statements written in lower case or indented, but not text inside comments', () => {
		const dump = '-- insert into `ghost` (`id`) values (1);\n  insert into `pet` (`id`) values (1);\n'

		expect([...parseMysqlDump(dump).keys()]).toEqual(['pet'])
	})

	it('rejects a string that ends in a lone backslash instead of dropping characters', () => {
		const dump = "INSERT INTO `pet` (`id`, `note`) VALUES (1, 'x\\"

		expect(() => parseMysqlDump(dump)).toThrow(/closing quote/)
	})

	it('returns no tables for a dump without INSERT statements', () => {
		expect(parseMysqlDump('-- empty\n').size).toBe(0)
	})

	it('parses a large statement without hitting argument limits', () => {
		const tuples = Array.from({ length: 150_000 }, (_, index) => `(${index})`).join(',')

		const rows = parseMysqlDump(`INSERT INTO \`big\` (\`id\`) VALUES ${tuples};\n`).get('big')

		expect(rows).toHaveLength(150_000)
	})

	describe('malformed dumps', () => {
		it('rejects an unterminated string and reports the offset, not the content', () => {
			const dump = "INSERT INTO `pet` (`id`, `name`) VALUES (1, 'secret-name"

			expect(() => parseMysqlDump(dump)).toThrow(MysqlDumpParseError)
			expect(() => parseMysqlDump(dump)).toThrow(/closing quote/)
			expect(messageOf(() => parseMysqlDump(dump))).not.toContain('secret-name')
		})

		it('rejects a tuple with fewer values than columns', () => {
			expect(() => parseMysqlDump('INSERT INTO `pet` (`id`, `name`) VALUES (1);\n')).toThrow(/expected ","/)
		})

		it.each(["_binary 'abc'", '0x1F2E', 'CURRENT_TIMESTAMP', '1.2.3'])(
			'rejects the unsupported literal %s',
			(literal) => {
				const dump = 'INSERT INTO `pet` (`id`, `blob`) VALUES (1, ' + literal + ');\n'

				expect(() => parseMysqlDump(dump)).toThrow(/a number, NULL or a quoted string/)
			},
		)

		it('rejects a statement that does not follow the expected INSERT shape', () => {
			expect(() => parseMysqlDump('INSERT INTO pet VALUES (1);\n')).toThrow(/INSERT INTO `table`/)
		})

		it('rejects a tuple list that is not terminated by a semicolon or a comma', () => {
			expect(() => parseMysqlDump('INSERT INTO `pet` (`id`) VALUES (1) (2);\n')).toThrow(/after a tuple/)
		})
	})
})
