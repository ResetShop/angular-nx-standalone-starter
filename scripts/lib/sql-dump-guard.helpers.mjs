/**
 * Pure helpers of `scripts/check-no-sql-dumps.mjs`.
 *
 * Database dumps are real data (the legacy Brillante export holds personal data), so they stay on the operator's
 * machine. Files the repository does not ignore are checked: tracked files and untracked files that `.gitignore`
 * does not cover. A dump kept in an ignored place (`*.dump.sql`, `legacy-dumps/`) is therefore fine, and a dump
 * anywhere else fails the check before it can be committed.
 */

/** Extensions of files that carry database dumps or backups. */
const DUMP_FILE_PATTERN = /\.(sql|dump|dmp|bak|sql\.(gz|zip|bz2|xz|7z))$/i

/** Directories that legitimately hold SQL: the generated Drizzle migrations. */
export const ALLOWED_SQL_DIRECTORIES = Object.freeze(['drizzle/'])

function normalize(path) {
	return path.replaceAll('\\', '/').replace(/^\.\//, '')
}

/**
 * Returns the paths that look like database dumps and are not inside an allowed directory.
 * @param {readonly string[]} paths repository-relative paths
 * @param {readonly string[]} [allowedDirectories]
 */
export function findForbiddenDumpFiles(paths, allowedDirectories = ALLOWED_SQL_DIRECTORIES) {
	return paths
		.map(normalize)
		.filter((path) => DUMP_FILE_PATTERN.test(path))
		.filter((path) => !allowedDirectories.some((directory) => path.startsWith(directory)))
}
