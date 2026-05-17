import { env } from '@config/env'
import { logger } from '@resetshop/util'
import type { Transporter } from 'nodemailer'
import * as nodemailer from 'nodemailer'
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
		const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass } = env

		// Defense-in-depth: the env schema's superRefine guarantees these are set
		// when EMAIL_PROVIDER=nodemailer, but we keep the runtime guard so the
		// constructor fails clearly if it's somehow instantiated without them.
		if (!host || !user || !pass) {
			throw new Error('SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS')
		}

		this.fromAddress = env.SMTP_FROM

		this.transporter = nodemailer.createTransport({
			host,
			port: env.SMTP_PORT,
			secure: env.SMTP_SECURE,
			auth: {
				user,
				pass,
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
