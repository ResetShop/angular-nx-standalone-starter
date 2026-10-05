/**
 * An error whose message was written by the importer and holds no personal data: counts, reason codes, legacy ids,
 * table and column names, offsets. Only these messages may reach the terminal; any other error (a database driver
 * error echoes the failed statement together with its parameters, which are names and emails) is reported without
 * its message.
 */
export class SafeImportError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'SafeImportError'
	}
}
