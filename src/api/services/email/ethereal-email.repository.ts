import type { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import type { IEmailRepository, SendEmailParams } from './interfaces';

/**
 * Ethereal email repository using Nodemailer's test service.
 * Activated when EMAIL_PROVIDER is 'ethereal'.
 *
 * No environment variables required — Ethereal generates test credentials
 * automatically. The transporter is created eagerly at construction time
 * (as a Promise) and shared across all send() calls.
 *
 * After each email is sent, the Ethereal preview URL is logged so the
 * developer can inspect the email in a browser.
 *
 * Intended for local development and testing only.
 */
export class EtherealEmailRepository implements IEmailRepository {
	private readonly transporterPromise: Promise<Transporter>;

	constructor() {
		this.transporterPromise = this.createTransporter();
	}

	async send(params: SendEmailParams): Promise<void> {
		const transporter = await this.transporterPromise;

		const info = await transporter.sendMail({
			from: 'noreply@example.ethereal',
			to: params.to,
			subject: params.subject,
			html: params.html,
			text: params.text,
		});

		const previewUrl = nodemailer.getTestMessageUrl(info);
		if (previewUrl) {
			// TODO(#66): Replace with structured logging service
			console.log(
				JSON.stringify({
					event: 'ethereal_email_preview',
					previewUrl,
					recipient: params.to,
					subject: params.subject,
				}),
			);
		}
	}

	private async createTransporter(): Promise<Transporter> {
		const testAccount = await nodemailer.createTestAccount();

		return nodemailer.createTransport({
			host: testAccount.smtp.host,
			port: testAccount.smtp.port,
			secure: testAccount.smtp.secure,
			auth: {
				user: testAccount.user,
				pass: testAccount.pass,
			},
		});
	}
}
