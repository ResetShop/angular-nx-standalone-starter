import { describeConnectionTarget, formatImportFailure } from './import-legacy-users.output'
import { SafeImportError } from './safe-import-error'

describe('describeConnectionTarget', () => {
	it('shows host, port and database but never the credentials', () => {
		const described = describeConnectionTarget(
			'postgresql://someone:s3cret-pass@db.example.test:6543/legacy?sslmode=require',
		)

		expect(described).toBe('db.example.test:6543/legacy')
		expect(described).not.toMatch(/someone|s3cret/)
	})

	it('omits the port when the connection string has none', () => {
		expect(describeConnectionTarget('postgres://u:p@localhost/brillante')).toBe('localhost/brillante')
	})

	it('does not echo a connection string it cannot parse', () => {
		expect(describeConnectionTarget('not a url but has s3cret in it')).toBe(
			'(the connection string could not be parsed)',
		)
	})
})

describe('formatImportFailure', () => {
	it('shows the message of an error the importer wrote itself', () => {
		expect(formatImportFailure(new SafeImportError('The target has no role with id 2'))).toBe(
			'The target has no role with id 2',
		)
	})

	it('reduces a drizzle query error to the database code, table and constraint, without any parameter', () => {
		const pgError = Object.assign(new Error('duplicate key value violates unique constraint'), {
			code: '23505',
			table: 'user',
			constraint: 'user_email_unique',
			detail: 'Key (email)=(ada.lovelace@example.test) already exists.',
		})
		const drizzleError = new Error(
			'Failed query: insert into "user" ("id", "first_name", "email") values ($1, $2, $3)\nparams: 2,Ada,ada.lovelace@example.test',
			{ cause: pgError },
		)

		const text = formatImportFailure(drizzleError)

		expect(text).toBe(
			'Database error (code 23505, table user, constraint user_email_unique). The message is withheld because it can contain personal data.',
		)
		expect(text).not.toMatch(/Ada|lovelace|example\.test|insert into/)
	})

	it('withholds the message of any other error and names only its type', () => {
		const text = formatImportFailure(new TypeError('Cannot read properties of Ada Lovelace'))

		expect(text).toBe('Unexpected TypeError. The message is withheld because it can contain personal data.')
		expect(text).not.toContain('Ada')
	})

	it('copes with a thrown value that is not an Error', () => {
		expect(formatImportFailure('Ada Lovelace')).toBe(
			'Unexpected string. The message is withheld because it can contain personal data.',
		)
	})
})
