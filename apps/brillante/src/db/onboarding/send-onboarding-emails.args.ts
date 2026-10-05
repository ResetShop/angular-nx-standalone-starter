import { SafeImportError } from '../legacy-import/safe-import-error'

export interface SendOnboardingEmailsArgs {
	/** True unless `--apply` was given: emails are only sent when the operator asks for it. */
	readonly dryRun: boolean
	/** Limit the send to these user ids, or `null` for everyone who still has to choose a password. */
	readonly userIds: readonly number[] | null
}

export const SEND_ONBOARDING_EMAILS_USAGE =
	'Usage: send-onboarding-emails [--dry-run | --apply] [--user-ids <id,id,...>]\n' +
	'Without --apply nothing is sent. With npm, put -- before the options: npm run <script> -- --apply'

function fail(message: string): never {
	throw new SafeImportError(`${message}\n${SEND_ONBOARDING_EMAILS_USAGE}`)
}

function parseIds(raw: string): number[] {
	const parts = raw.split(',').map((part) => part.trim())
	if (parts.some((part) => !/^[1-9]\d*$/.test(part))) {
		fail('--user-ids takes positive integer ids separated by commas.')
	}
	return [...new Set(parts.map(Number))]
}

/**
 * Parses the command line token by token, rejecting anything unknown: a mistyped option must never be ignored
 * silently, because `--apply` sends real emails. A dry run is the default.
 */
export function parseSendOnboardingEmailsArgs(argv: readonly string[]): SendOnboardingEmailsArgs {
	let userIds: number[] | null = null
	let dryRun = false
	let apply = false

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index]
		if (token === '--dry-run') {
			dryRun = true
		} else if (token === '--apply') {
			apply = true
		} else if (token === '--user-ids') {
			const value = argv[index + 1]
			if (value === undefined || value.startsWith('--')) fail('--user-ids needs a value.')
			index += 1
			userIds = parseIds(value)
		} else {
			fail(`Unknown option or stray argument ${token}.`)
		}
	}

	if (dryRun && apply) fail('--dry-run and --apply cannot be combined.')
	return { dryRun: !apply, userIds }
}
