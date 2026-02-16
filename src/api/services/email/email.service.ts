import type { IEmailRepository, IEmailService, SendEmailParams } from './interfaces';

interface EmailServiceDeps {
	emailRepository: IEmailRepository;
}

/**
 * Application-level email service.
 * Delegates delivery to an injected IEmailRepository, handling errors
 * and structured logging.
 *
 * The concrete repository is selected at container setup time via the
 * EMAIL_PROVIDER environment variable:
 * - 'smtp'     (default) — SmtpEmailRepository, requires SMTP_* env vars
 * - 'ethereal' — EtherealEmailRepository, no env vars needed (test accounts)
 */
export class EmailService implements IEmailService {
	private readonly emailRepository: IEmailRepository;

	constructor({ emailRepository }: EmailServiceDeps) {
		this.emailRepository = emailRepository;
	}

	async sendEmail(params: SendEmailParams): Promise<boolean> {
		try {
			await this.emailRepository.send(params);

			return true;
		} catch (error) {
			// TODO(#66): Replace with structured logging service
			console.error(
				JSON.stringify({
					event: 'email_send_failed',
					recipient: params.to,
					subject: params.subject,
					error: error instanceof Error ? error.message : String(error),
					timestamp: new Date().toISOString(),
				}),
			);

			return false;
		}
	}
}
