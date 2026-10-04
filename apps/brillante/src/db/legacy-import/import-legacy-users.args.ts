export interface ImportLegacyUsersArgs {
	readonly dumpPath: string
	readonly dryRun: boolean
	readonly alreadyProvisionedLegacyUserIds: readonly number[]
	/** Where to also write the report (counts and ids only), if anywhere. */
	readonly reportPath: string | null
}

export const IMPORT_LEGACY_USERS_USAGE =
	'Usage: import-legacy-users --dump <path> [--dry-run] [--already-provisioned <id,id,...>] [--report <path>]'

function valueOf(argv: readonly string[], flag: string): string | null {
	const index = argv.indexOf(flag)
	if (index === -1) return null
	const value = argv[index + 1]
	if (value === undefined || value.startsWith('--')) {
		throw new Error(`${flag} needs a value.\n${IMPORT_LEGACY_USERS_USAGE}`)
	}
	return value
}

function parseIds(raw: string | null): number[] {
	if (raw === null) return []
	const ids = raw.split(',').map((part) => Number(part.trim()))
	if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
		throw new Error(
			`--already-provisioned takes positive integer ids separated by commas.\n${IMPORT_LEGACY_USERS_USAGE}`,
		)
	}
	return ids
}

/** Parses the command line of the import. The dump path is mandatory: there is no default location for personal data. */
export function parseImportLegacyUsersArgs(argv: readonly string[]): ImportLegacyUsersArgs {
	const known = new Set(['--dump', '--dry-run', '--already-provisioned', '--report'])
	const unknown = argv.filter((argument) => argument.startsWith('--') && !known.has(argument))
	if (unknown.length > 0) {
		throw new Error(`Unknown option ${unknown.join(', ')}.\n${IMPORT_LEGACY_USERS_USAGE}`)
	}

	const dumpPath = valueOf(argv, '--dump')
	if (dumpPath === null) {
		throw new Error(`--dump is required.\n${IMPORT_LEGACY_USERS_USAGE}`)
	}

	return {
		dumpPath,
		dryRun: argv.includes('--dry-run'),
		alreadyProvisionedLegacyUserIds: parseIds(valueOf(argv, '--already-provisioned')),
		reportPath: valueOf(argv, '--report'),
	}
}
