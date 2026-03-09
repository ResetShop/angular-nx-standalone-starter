import type { IEmailRepository, SendEmailParams } from './interfaces';

/**
 * No-op email repository that silently discards all emails.
 * Used in integration tests to avoid Ethereal SMTP round-trips.
 */
export class NoopEmailRepository implements IEmailRepository {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- interface contract requires the parameter
	async send(params: SendEmailParams): Promise<void> {
		// Intentionally empty — emails are not sent in this mode
	}
}
