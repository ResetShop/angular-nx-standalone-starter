import nodemailer, { type Transporter } from 'nodemailer';
import type { IEmailService, SendEmailParams } from './interfaces';

/**
 * Email service using Nodemailer SMTP transport.
 * Handles email delivery with structured error logging.
 *
 * Required environment variables:
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_USER: SMTP authentication username
 * - SMTP_PASS: SMTP authentication password
 *
 * Optional environment variables:
 * - SMTP_PORT: SMTP port (default: 587)
 * - SMTP_SECURE: Use TLS on port 465 (default: false)
 * - SMTP_FROM: Default sender address (default: noreply@example.com)
 */
export class EmailService implements IEmailService {
	private readonly transporter: Transporter;
	private readonly fromAddress: string;

	constructor() {
		const host = process.env['SMTP_HOST'];
		const user = process.env['SMTP_USER'];
		const pass = process.env['SMTP_PASS'];

		if (!host || !user || !pass) {
			throw new Error('SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS');
		}

		const port = parseInt(process.env['SMTP_PORT'] || '587', 10);
		const secure = process.env['SMTP_SECURE'] === 'true';
		this.fromAddress = process.env['SMTP_FROM'] || 'noreply@example.com';

		this.transporter = nodemailer.createTransport({
			host,
			port,
			secure,
			auth: {
				user,
				pass,
			},
		});
	}

	/**
	 * Sends an email using the configured SMTP transport.
	 * Returns true on success, false on failure.
	 * Never throws - failures are logged and returned as false.
	 *
	 * @param params - Email parameters (to, subject, html, text)
	 * @returns Promise<boolean> - true if email sent successfully, false otherwise
	 */
	async sendEmail(params: SendEmailParams): Promise<boolean> {
		try {
			await this.transporter.sendMail({
				from: this.fromAddress,
				to: params.to,
				subject: params.subject,
				html: params.html,
				text: params.text,
			});

			return true;
		} catch (error) {
			// Structured JSON logging on failure
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
