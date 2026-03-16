import { z } from 'zod'
import type { IEmailRepository, IEmailService, SendEmailParams } from './interfaces'

interface EmailServiceDeps {
	emailRepository: IEmailRepository
}

/**
 * Application-level email service.
 * Delegates delivery to an injected IEmailRepository, handling errors
 * and structured logging.
 *
 * The concrete repository is selected at container setup time via the
 * EMAIL_PROVIDER environment variable:
 * - 'nodemailer' (default) — NodemailerRepository, requires SMTP_* env vars
 * - 'ethereal' — EtherealEmailRepository, no env vars needed (test accounts)
 */
export class EmailService implements IEmailService {
	private readonly emailRepository: IEmailRepository
	private readonly sendEmailSchema = z.object({
		to: z.email('Invalid recipient email address'),
		subject: z.string().min(1, 'Subject is required'),
		html: z.string().min(1, 'HTML content is required'),
		text: z.string().min(1, 'Text content is required'),
	})

	constructor({ emailRepository }: EmailServiceDeps) {
		this.emailRepository = emailRepository
	}

	async send(params: SendEmailParams): Promise<void> {
		this.sendEmailSchema.parse(params)

		try {
			await this.emailRepository.send(params)
		} catch (error) {
			// TODO(#66): Replace with structured logging service
			try {
				console.error(
					JSON.stringify({
						event: 'email_send_failed',
						recipient: params.to,
						subject: params.subject,
						error: error instanceof Error ? error.message : String(error),
						timestamp: new Date().toISOString(),
					}),
				)
			} catch {
				console.error('email_send_failed', params.to, params.subject)
			}

			throw error
		}
	}
}
