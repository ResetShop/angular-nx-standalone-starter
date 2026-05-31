import { logger } from '@resetshop/util'
import type { Transporter } from 'nodemailer'
import * as nodemailer from 'nodemailer'
import { emailEnv } from '../../config/email.env'
import type { EmailRepository, SendEmailParams } from './interfaces'

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
export class NodemailerRepository implements EmailRepository {
	private readonly transporter: Transporter
	private readonly fromAddress: string

	constructor() {
		// SMTP settings come from the validated emailEnv proxy. When EMAIL_PROVIDER=nodemailer,
		// emailEnv's superRefine guarantees SMTP_HOST/USER/PASS are present (failing fast at boot
		// otherwise), and SMTP_PORT is already a coerced, range-validated number (default 587).
		this.fromAddress = emailEnv.SMTP_FROM

		this.transporter = nodemailer.createTransport({
			host: emailEnv.SMTP_HOST,
			port: emailEnv.SMTP_PORT,
			secure: emailEnv.SMTP_SECURE,
			auth: {
				user: emailEnv.SMTP_USER,
				pass: emailEnv.SMTP_PASS,
			},
		})
	}

	public async send(params: SendEmailParams): Promise<void> {
		const info = await this.transporter.sendMail({
			from: this.fromAddress,
			to: params.to,
			subject: params.subject,
			html: params.html,
			text: params.text,
		})

		const rejected = Array.isArray(info.rejected) ? info.rejected : []
		if (rejected.length > 0) {
			logger.security('email_recipients_rejected', { rejected, recipient: params.to, subject: params.subject })
			throw new Error(`Recipients rejected by SMTP server: ${rejected.join(', ')}`)
		}
	}
}
