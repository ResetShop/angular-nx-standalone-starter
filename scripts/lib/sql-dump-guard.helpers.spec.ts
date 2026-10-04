import { ALLOWED_SQL_DIRECTORIES, findForbiddenDumpFiles } from './sql-dump-guard.helpers.mjs'

describe('findForbiddenDumpFiles', () => {
	it('flags SQL dumps and backups outside the migrations directory', () => {
		const paths = [
			'resources/database.sql',
			'apps/brillante/data/legacy.dump',
			'backup.sql.gz',
			'old.BAK',
			'export.sql.zip',
			'export.sql.bz2',
			'export.sql.xz',
			'export.sql.7z',
			'oracle.dmp',
		]

		expect(findForbiddenDumpFiles(paths)).toEqual(paths)
	})

	it('allows the Drizzle migrations', () => {
		expect(findForbiddenDumpFiles(['drizzle/0000_absurd_blue_marvel.sql', 'drizzle/meta/_journal.json'])).toEqual([])
	})

	it('ignores files that are not dumps', () => {
		expect(findForbiddenDumpFiles(['src/app/app.ts', 'docs/sql-notes.md', 'sql/readme.txt'])).toEqual([])
	})

	it('normalises Windows separators and a leading ./', () => {
		expect(findForbiddenDumpFiles(['.\\data\\users.sql', './drizzle/0001_x.sql'])).toEqual(['data/users.sql'])
	})

	it('does not treat a directory that merely starts like an allowed one as allowed', () => {
		expect(findForbiddenDumpFiles(['drizzle-backups/users.sql'])).toEqual(['drizzle-backups/users.sql'])
	})

	it('accepts a custom list of allowed directories', () => {
		expect(findForbiddenDumpFiles(['fixtures/seed.sql'], ['fixtures/'])).toEqual([])
	})

	it('allows only the migrations directory by default', () => {
		expect(ALLOWED_SQL_DIRECTORIES).toEqual(['drizzle/'])
	})
})
