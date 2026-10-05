import { SafeImportError } from './safe-import-error'

export interface ImportLegacyUsersArgs {
	readonly dumpPath: string
	/** True unless `--apply` was given: the import only writes when the operator asks for it. */
	readonly dryRun: boolean
	readonly alreadyProvisionedLegacyUserIds: readonly number[]
	/** Where to also write the report (counts and ids only), if anywhere. */
	readonly reportPath: string | null
}

export const IMPORT_LEGACY_USERS_USAGE =
	'Usage: import-legacy-users --dump <path> [--dry-run | --apply] [--already-provisioned <id,id,...>] [--report <path>]\n' +
	'Without --apply nothing is written. With npm, put -- before the options: npm run <script> -- --dump <path> --apply'

function fail(message: string): never {
	throw new SafeImportError(`${message}\n${IMPORT_LEGACY_USERS_USAGE}`)
}

function parseIds(raw: string): number[] {
	const parts = raw.split(',').map((part) => part.trim())
	if (parts.some((part) => !/^[1-9]\d*$/.test(part))) {
		fail('--already-provisioned takes positive integer ids separated by commas.')
	}
	return [...new Set(parts.map(Number))]
}

/**
 * Parses the command line of the import, walking it token by token: anything that is not a known option or the value
 * of one is rejected. A mistyped or misplaced option must never be ignored silently, because the import writes personal
 * data; for the same reason it writes only with an explicit `--apply`, and a dry run is the default. The dump path is
 * mandatory: there is no default location for personal data.
 */
export function parseImportLegacyUsersArgs(argv: readonly string[]): ImportLegacyUsersArgs {
	let dumpPath: string | null = null
	let reportPath: string | null = null
	let alreadyProvisioned: number[] = []
	let dryRun = false
	let apply = false

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index]
		if (token === '--dry-run') {
			dryRun = true
		} else if (token === '--apply') {
			apply = true
		} else if (token === '--dump' || token === '--report' || token === '--already-provisioned') {
			const value = argv[index + 1]
			if (value === undefined || value.startsWith('--')) fail(`${token} needs a value.`)
			index += 1
			if (token === '--dump') dumpPath = value
			else if (token === '--report') reportPath = value
			else alreadyProvisioned = parseIds(value)
		} else {
			fail(`Unknown option or stray argument ${token}.`)
		}
	}

	if (dumpPath === null) fail('--dump is required.')
	if (dryRun && apply) fail('--dry-run and --apply cannot be combined.')
	return { dumpPath, dryRun: !apply, alreadyProvisionedLegacyUserIds: alreadyProvisioned, reportPath }
}
