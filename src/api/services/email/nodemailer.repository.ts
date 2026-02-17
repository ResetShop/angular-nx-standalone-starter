import type { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import type { IEmailRepository, SendEmailParams } from './interfaces';

/**
 * Nodemailer email repository using SMTP transport.
 * Activated when EMAIL_PROVIDER is 'nodemailer' (or unset — this is the default).
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
export class NodemailerRepository implements IEmailRepository {
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
		if (isNaN(port) || port < 1 || port > 65535) {
			throw new Error(`Invalid SMTP_PORT: "${process.env['SMTP_PORT']}". Must be a number between 1 and 65535`);
		}
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

	async send(params: SendEmailParams): Promise<void> {
		await this.transporter.sendMail({
			from: this.fromAddress,
			to: params.to,
			subject: params.subject,
			html: params.html,
			text: params.text,
		});
	}
}
