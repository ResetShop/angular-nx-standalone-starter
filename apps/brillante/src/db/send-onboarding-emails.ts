import { parseDurationToMs } from '@resetshop/util'
import { dbEnv } from '../api/config/db.env'
import { emailEnv } from '../api/config/email.env'
import { ONBOARDING_RESET_TOKEN_EXPIRY } from '../api/constants/auth.constants'
import { createDrizzlePgConnector } from '../api/helpers/drizzle-postgres-connector'
import { EmailService } from '../api/services/email/email.service'
import { EtherealEmailRepository } from '../api/services/email/ethereal-email.repository'
import { type EmailRepository } from '../api/services/email/interfaces'
import { NodemailerRepository } from '../api/services/email/nodemailer.repository'
import { NoopEmailRepository } from '../api/services/email/noop-email.repository'
import { describeConnectionTarget, formatImportFailure } from './legacy-import/import-legacy-users.output'
import { SafeImportError } from './legacy-import/safe-import-error'
import { DrizzleOnboardingTarget } from './onboarding/drizzle-onboarding-target'
import { assertEtherealRecipientsAreFake } from './onboarding/fake-address-guard'
import { type OnboardingMailer, runOnboarding } from './onboarding/onboarding'
import { parseSendOnboardingEmailsArgs } from './onboarding/send-onboarding-emails.args'

function createEmailRepository(provider: string): EmailRepository {
	if (provider === 'noop') return new NoopEmailRepository()
	if (provider === 'ethereal') return new EtherealEmailRepository()
	return new NodemailerRepository()
}

/** The configured provider; an invalid email configuration is explained without echoing its values. */
function readEmailProvider(): string {
	try {
		return emailEnv.EMAIL_PROVIDER
	} catch {
		throw new SafeImportError(
			'The email configuration is invalid: set EMAIL_PROVIDER (ethereal, nodemailer or noop) and, for nodemailer, the SMTP_* variables.',
		)
	}
}

/**
 * Sends every migrated user who has not chosen a password yet an email with a single-use link (valid for
 * `ONBOARDING_RESET_TOKEN_EXPIRY`) to do so. Without `--apply` it only previews who would be mailed. See
 * docs/brillante-backend.md ("Onboarding the migrated users") for the runbook.
 *
 * Usage: npm run send:onboarding-emails:brillante -- [--apply] [--user-ids 2,3]
 */
async function sendOnboardingEmails(): Promise<number> {
	const args = parseSendOnboardingEmailsArgs(process.argv.slice(2))
	const provider = readEmailProvider()
	console.log(`Target database: ${describeConnectionTarget(dbEnv.PG_CONNECTION_STRING)}`)
	console.log(`Email provider: ${provider}`)
	console.log(args.dryRun ? 'DRY RUN: nothing will be sent.' : 'APPLY: sending the onboarding emails.')

	const db = createDrizzlePgConnector()
	try {
		const emailService = new EmailService({ emailRepository: createEmailRepository(provider) })
		const mailer: OnboardingMailer = { send: (to, content) => emailService.send({ to, ...content }) }
		const result = await runOnboarding(new DrizzleOnboardingTarget(db), mailer, {
			dryRun: args.dryRun,
			requestedUserIds: args.userIds,
			tokenLifetimeMs: parseDurationToMs(ONBOARDING_RESET_TOKEN_EXPIRY),
			pauseBetweenSendsMs: parseDurationToMs('500ms'),
			precheck: ({ recipients }) => {
				assertEtherealRecipientsAreFake(provider, recipients)
				if (provider === 'noop' && !args.dryRun && recipients.length > 0) {
					throw new SafeImportError(
						'EMAIL_PROVIDER=noop would issue reset links that nobody receives. Configure a real provider, or ethereal for fake users.',
					)
				}
			},
		})
		console.log(result.report)
		return result.failedUserIds.length > 0 ? 1 : 0
	} finally {
		await db.$client.end()
	}
}

sendOnboardingEmails()
	.then((code) => process.exit(code))
	.catch((error: unknown) => {
		console.error(`Onboarding failed: ${formatImportFailure(error)}`)
		process.exit(1)
	})
