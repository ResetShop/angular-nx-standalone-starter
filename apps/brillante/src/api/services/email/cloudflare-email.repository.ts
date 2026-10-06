import { logger } from '@resetshop/util'
import { emailEnv } from '../../config/email.env'
import { requireEmailBinding } from '../../helpers/request-email'
import type { EmailRepository, SendEmailParams } from './interfaces'

/**
 * Email repository over the Cloudflare Email Service binding (`send_email` in wrangler.jsonc).
 * Activated when EMAIL_PROVIDER is 'cloudflare'; only works inside a Worker request, where the binding exists.
 * The sender is `EMAIL_FROM`, an address of a domain onboarded to Email Service.
 */
export class CloudflareEmailRepository implements EmailRepository {
	public async send(params: SendEmailParams): Promise<void> {
		const binding = requireEmailBinding()
		const address = emailEnv.EMAIL_FROM
		if (!address) {
			throw new Error('EMAIL_FROM is required when EMAIL_PROVIDER=cloudflare')
		}
		const name = emailEnv.EMAIL_FROM_NAME
		const from = name ? { email: address, name } : address

		try {
			const { messageId } = await binding.send({
				from,
				to: params.to,
				subject: params.subject,
				html: params.html,
				text: params.text,
			})
			logger.info('CloudflareEmail', `message ${messageId} accepted`)
		} catch (error) {
			// The binding reports why a message was refused in `code` (for example E_SENDER_NOT_VERIFIED). Its own
			// message may echo the recipient, so only the code goes into the error that gets logged; the original stays
			// in `cause`.
			const code = (error as { code?: unknown }).code
			throw new Error(`Cloudflare Email Service refused the message${code ? ` (${String(code)})` : ''}`, {
				cause: error,
			})
		}
	}
}
